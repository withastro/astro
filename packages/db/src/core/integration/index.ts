import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration, HookParameters } from 'astro';
import colors from 'picocolors';
import {
	createServer,
	type HMRPayload,
	loadEnv,
	mergeConfig,
	type UserConfig,
	type ViteDevServer,
} from 'vite';
import parseArgs from 'yargs-parser';
import { z } from 'zod';
import { AstroDbError, isDbError } from '../../runtime/utils.js';
import { CONFIG_FILE_NAMES, DB_PATH, VIRTUAL_MODULE_ID } from '../consts.js';
import { EXEC_DEFAULT_EXPORT_ERROR, EXEC_ERROR } from '../errors.js';
import { resolveDbConfig } from '../load-file.js';
import { SEED_DEV_FILE_NAME } from '../queries.js';
import { getDbDirectoryUrl, getRemoteDatabaseInfo, type VitePlugin } from '../utils.js';
import { fileURLIntegration } from './file-url.js';
import { getDtsContent } from './typegen.js';
import {
	type LateSeedFiles,
	type LateTables,
	type SeedHandler,
	vitePluginDb,
} from './vite-plugin-db.js';
import { vitePluginDbClient } from './vite-plugin-db-client.js';

const astroDBConfigSchema = z
	.object({
		/**
		 * Sets the mode of the underlying `@libsql/client` connection.
		 *
		 * In most cases, the default 'node' mode is sufficient. On platforms like Cloudflare, or Deno, you may need to set this to 'web'.
		 *
		 * @default 'node'
		 */
		mode: z
			.union([z.literal('node'), z.literal('web')])
			.optional()
			.default('node'),
	})
	.optional()
	.default({});

export type AstroDBConfig = z.infer<typeof astroDBConfigSchema>;

function astroDBIntegration(options?: AstroDBConfig): AstroIntegration {
	const resolvedConfig = astroDBConfigSchema.parse(options);
	let connectToRemote = false;
	let configFileDependencies: string[] = [];
	let root: URL;
	// Used during production builds to load seed files.
	let tempViteServer: ViteDevServer | undefined;

	// Make table loading "late" to pass to plugins from `config:setup`,
	// but load during `config:done` to wait for integrations to settle.
	let tables: LateTables = {
		get() {
			throw new Error('[astro:db] INTERNAL Tables not loaded yet');
		},
	};
	let seedFiles: LateSeedFiles = {
		get() {
			throw new Error('[astro:db] INTERNAL Seed files not loaded yet');
		},
	};
	let seedHandler: SeedHandler = {
		execute: () => {
			throw new Error('[astro:db] INTERNAL Seed handler not loaded yet');
		},
		inProgress: false,
	};

	let command: HookParameters<'astro:config:setup'>['command'];
	let finalBuildOutput: string;
	return {
		name: 'astro:db',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, command: _command, logger }) => {
				command = _command;
				root = config.root;

				if (command === 'preview') return;

				let dbPlugin: VitePlugin | undefined = undefined;
				const args = parseArgs(process.argv.slice(3));
				connectToRemote = process.env.ASTRO_INTERNAL_TEST_REMOTE || args['remote'];

				const dbClientPlugin = vitePluginDbClient({
					connectToRemote,
					mode: resolvedConfig.mode,
				});

				if (connectToRemote) {
					dbPlugin = vitePluginDb({
						connectToRemote,
						appToken: getRemoteDatabaseInfo().token,
						tables,
						root: config.root,
						srcDir: config.srcDir,
						output: config.output,
						seedHandler,
					});
				} else {
					dbPlugin = vitePluginDb({
						connectToRemote,
						tables,
						seedFiles,
						root: config.root,
						srcDir: config.srcDir,
						output: config.output,
						logger,
						seedHandler,
					});
				}

				updateConfig({
					vite: {
						assetsInclude: [DB_PATH],
						plugins: [dbClientPlugin, dbPlugin],
					},
				});
			},
			'astro:config:done': async ({ config, injectTypes, buildOutput }) => {
				if (command === 'preview') return;

				finalBuildOutput = buildOutput;

				// TODO: refine where we load tables
				// @matthewp: may want to load tables by path at runtime
				const { dbConfig, dependencies, integrationSeedPaths } = await resolveDbConfig(config);
				tables.get = () => dbConfig.tables;
				seedFiles.get = () => integrationSeedPaths;
				configFileDependencies = dependencies;

				const localDbUrl = new URL(DB_PATH, config.root);
				if (!connectToRemote && !existsSync(localDbUrl)) {
					await mkdir(dirname(fileURLToPath(localDbUrl)), { recursive: true });
					await writeFile(localDbUrl, '');
				}

				injectTypes({
					filename: 'db.d.ts',
					content: getDtsContent(tables.get() ?? {}),
				});
			},
			'astro:server:setup': async ({ server, logger }) => {
				seedHandler.execute = async (fileUrl) => {
					await executeSeedFile({ fileUrl, viteServer: server });
				};
				const filesToWatch = [
					...CONFIG_FILE_NAMES.map((c) => new URL(c, getDbDirectoryUrl(root))),
					...configFileDependencies.map((c) => new URL(c, root)),
				];
				server.watcher.on('all', (_event, relativeEntry) => {
					const entry = new URL(relativeEntry, root);
					if (filesToWatch.some((f) => entry.href === f.href)) {
						server.restart();
					}
				});
				// Wait for dev server log before showing "connected".
				setTimeout(() => {
					logger.info(
						connectToRemote ? 'Connected to remote database.' : 'New local database created.',
					);
					if (connectToRemote) return;

					const localSeedPaths = SEED_DEV_FILE_NAME.map(
						(name) => new URL(name, getDbDirectoryUrl(root)),
					);
					// Eager load astro:db module on startup
					if (seedFiles.get().length || localSeedPaths.find((path) => existsSync(path))) {
						server.ssrLoadModule(VIRTUAL_MODULE_ID).catch((e) => {
							logger.error(e instanceof Error ? e.message : String(e));
						});
					}
				}, 100);
			},
			'astro:build:start': async ({ logger }) => {
				if (!connectToRemote && !databaseFileEnvDefined() && finalBuildOutput === 'server') {
					const message = `Attempting to build without the --remote flag or the ASTRO_DATABASE_FILE environment variable defined. You probably want to pass --remote to astro build.`;
					const hint =
						'Learn more connecting to libSQL: https://docs.astro.build/en/guides/astro-db/#connect-a-libsql-database-for-production';
					throw new AstroDbError(message, hint);
				}

				logger.info(
					'database: ' +
						(connectToRemote ? colors.yellow('remote') : colors.blue('local database.')),
				);
			},
			'astro:build:setup': async ({ vite }) => {
				tempViteServer = await getTempViteServer({ viteConfig: vite });
				seedHandler.execute = async (fileUrl) => {
					await executeSeedFile({ fileUrl, viteServer: tempViteServer! });
				};
			},
			'astro:build:done': async ({}) => {
				await tempViteServer?.close();
			},
		},
	};
}

function databaseFileEnvDefined() {
	const env = loadEnv('', process.cwd());
	return env.ASTRO_DATABASE_FILE != null || process.env.ASTRO_DATABASE_FILE != null;
}

export function integration(options?: AstroDBConfig): AstroIntegration[] {
	return [astroDBIntegration(options), fileURLIntegration()];
}

async function executeSeedFile({
	fileUrl,
	viteServer,
}: {
	fileUrl: URL;
	viteServer: ViteDevServer;
}) {
	// Use decodeURIComponent to handle paths with spaces correctly
	// This ensures that %20 in the pathname is properly handled
	const pathname = decodeURIComponent(fileUrl.pathname);
	const mod = await viteServer.ssrLoadModule(pathname);
	if (typeof mod.default !== 'function') {
		throw new AstroDbError(EXEC_DEFAULT_EXPORT_ERROR(fileURLToPath(fileUrl)));
	}
	try {
		await mod.default();
	} catch (e) {
		if (isDbError(e)) {
			throw new AstroDbError(EXEC_ERROR(e.message));
		}
		throw e;
	}
}

/**
 * Inspired by Astro content collection config loader.
 */
async function getTempViteServer({ viteConfig }: { viteConfig: UserConfig }) {
	const tempViteServer = await createServer(
		mergeConfig(viteConfig, {
			server: { middlewareMode: true, hmr: false, watch: null, ws: false },
			optimizeDeps: { noDiscovery: true },
			ssr: { external: [] },
			logLevel: 'silent',
		}),
	);

	const hotSend = tempViteServer.hot.send;
	tempViteServer.hot.send = (payload: HMRPayload) => {
		if (payload.type === 'error') {
			throw payload.err;
		}
		return hotSend(payload);
	};

	return tempViteServer;
}

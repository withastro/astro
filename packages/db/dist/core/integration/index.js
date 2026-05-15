import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import colors from 'piccolore';
import { createServer, loadEnv, mergeConfig } from 'vite';
import parseArgs from 'yargs-parser';
import * as z from 'zod/v4';
import { AstroDbError, getDbError } from '../../runtime/utils.js';
import { CONFIG_FILE_NAMES, DB_PATH, VIRTUAL_MODULE_ID } from '../consts.js';
import { EXEC_DEFAULT_EXPORT_ERROR, EXEC_ERROR } from '../errors.js';
import { resolveDbConfig } from '../load-file.js';
import { SEED_DEV_FILE_NAME } from '../queries.js';
import { getDbDirectoryUrl, getRemoteDatabaseInfo } from '../utils.js';
import { fileURLIntegration } from './file-url.js';
import { getDtsContent } from './typegen.js';
import { vitePluginDb } from './vite-plugin-db.js';
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
	.prefault({});
function astroDBIntegration(options) {
	const resolvedConfig = astroDBConfigSchema.parse(options);
	let connectToRemote = false;
	let configFileDependencies = [];
	let root;
	let tempViteServer;
	let tables = {
		get() {
			throw new Error('[astro:db] INTERNAL Tables not loaded yet');
		},
	};
	let seedFiles = {
		get() {
			throw new Error('[astro:db] INTERNAL Seed files not loaded yet');
		},
	};
	let seedHandler = {
		execute: () => {
			throw new Error('[astro:db] INTERNAL Seed handler not loaded yet');
		},
		inProgress: false,
	};
	let command;
	let finalBuildOutput;
	return {
		name: 'astro:db',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, command: _command, logger }) => {
				command = _command;
				root = config.root;
				if (command === 'preview') return;
				let dbPlugin = void 0;
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
				const environment = server.environments.ssr;
				seedHandler.execute = async (fileUrl) => {
					await executeSeedFile({ fileUrl, environment });
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
				logger.info(
					connectToRemote ? 'Connected to remote database.' : 'New local database created.',
				);
				if (connectToRemote) return;
				const localSeedPaths = SEED_DEV_FILE_NAME.map(
					(name) => new URL(name, getDbDirectoryUrl(root)),
				);
				if (seedFiles.get().length || localSeedPaths.find((path) => existsSync(path))) {
					await environment.runner.import(VIRTUAL_MODULE_ID).catch((e) => {
						logger.error(e instanceof Error ? e.message : String(e));
					});
				}
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
				const environment = tempViteServer.environments.ssr;
				seedHandler.execute = async (fileUrl) => {
					await executeSeedFile({ fileUrl, environment });
				};
			},
			'astro:build:done': async () => {
				await tempViteServer?.close();
			},
		},
	};
}
function databaseFileEnvDefined() {
	const env = loadEnv('', process.cwd());
	return env.ASTRO_DATABASE_FILE != null || process.env.ASTRO_DATABASE_FILE != null;
}
function integration(options) {
	return [astroDBIntegration(options), fileURLIntegration()];
}
async function executeSeedFile({ fileUrl, environment }) {
	const pathname = decodeURIComponent(fileUrl.pathname);
	const mod = await environment.runner.import(pathname);
	if (typeof mod.default !== 'function') {
		throw new AstroDbError(EXEC_DEFAULT_EXPORT_ERROR(fileURLToPath(fileUrl)));
	}
	try {
		await mod.default();
	} catch (e) {
		const dbError = getDbError(e);
		if (dbError) {
			throw new AstroDbError(EXEC_ERROR(dbError.message));
		}
		throw e;
	}
}
async function getTempViteServer({ viteConfig }) {
	const tempViteServer = await createServer(
		mergeConfig(viteConfig, {
			server: { middlewareMode: true, hmr: false, watch: null, ws: false },
			optimizeDeps: { noDiscovery: true },
			ssr: { external: [] },
			logLevel: 'silent',
		}),
	);
	const hotSend = tempViteServer.environments.client.hot.send;
	tempViteServer.environments.client.hot.send = (payload) => {
		if (payload.type === 'error') {
			throw payload.err;
		}
		return hotSend(payload);
	};
	return tempViteServer;
}
export { integration };

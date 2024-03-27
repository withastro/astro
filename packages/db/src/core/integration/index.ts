import { existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import type { AstroConfig, AstroIntegration } from 'astro';
import { AstroError } from 'astro/errors';
import { mkdir, writeFile } from 'fs/promises';
import { blue, yellow } from 'kleur/colors';
import { loadEnv } from 'vite';
import parseArgs from 'yargs-parser';
import { CONFIG_FILE_NAMES, DB_PATH } from '../consts.js';
import { resolveDbConfig } from '../load-file.js';
import { type ManagedAppToken, getManagedAppTokenOrExit } from '../tokens.js';
import { type VitePlugin, getDbDirectoryUrl } from '../utils.js';
import { fileURLIntegration } from './file-url.js';
import { typegenInternal } from './typegen.js';
import { type LateSeedFiles, type LateTables, vitePluginDb } from './vite-plugin-db.js';
import { vitePluginInjectEnvTs } from './vite-plugin-inject-env-ts.js';

function astroDBIntegration(): AstroIntegration {
	let connectToStudio = false;
	let configFileDependencies: string[] = [];
	let root: URL;
	let appToken: ManagedAppToken | undefined;

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
	let command: 'dev' | 'build' | 'preview';
	let output: AstroConfig['output'] = 'server';
	return {
		name: 'astro:db',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, command: _command, logger }) => {
				command = _command;
				root = config.root;
				output = config.output;

				if (command === 'preview') return;

				let dbPlugin: VitePlugin | undefined = undefined;
				const args = parseArgs(process.argv.slice(3));
				connectToStudio = process.env.ASTRO_INTERNAL_TEST_REMOTE || args['remote'];

				if (connectToStudio) {
					appToken = await getManagedAppTokenOrExit();
					dbPlugin = vitePluginDb({
						connectToStudio,
						appToken: appToken.token,
						tables,
						root: config.root,
						srcDir: config.srcDir,
					});
				} else {
					dbPlugin = vitePluginDb({
						connectToStudio: false,
						tables,
						seedFiles,
						root: config.root,
						srcDir: config.srcDir,
					});
				}

				updateConfig({
					vite: {
						assetsInclude: [DB_PATH],
						plugins: [dbPlugin, vitePluginInjectEnvTs(config, logger)],
					},
				});
			},
			'astro:config:done': async ({ config }) => {
				if (command === 'preview') return;

				// TODO: refine where we load tables
				// @matthewp: may want to load tables by path at runtime
				const { dbConfig, dependencies, integrationSeedPaths } = await resolveDbConfig(config);
				tables.get = () => dbConfig.tables;
				seedFiles.get = () => integrationSeedPaths;
				configFileDependencies = dependencies;

				const localDbUrl = new URL(DB_PATH, config.root);
				if (!connectToStudio && !existsSync(localDbUrl)) {
					await mkdir(dirname(fileURLToPath(localDbUrl)), { recursive: true });
					await writeFile(localDbUrl, '');
				}

				await typegenInternal({ tables: tables.get() ?? {}, root: config.root });
			},
			'astro:server:start': async ({ logger }) => {
				// Wait for the server startup to log, so that this can come afterwards.
				setTimeout(() => {
					logger.info(
						connectToStudio ? 'Connected to remote database.' : 'New local database created.'
					);
				}, 100);
			},
			'astro:server:setup': async ({ server }) => {
				const filesToWatch = [
					...CONFIG_FILE_NAMES.map((c) => new URL(c, getDbDirectoryUrl(root))),
					...configFileDependencies.map((c) => new URL(c, root)),
				];
				server.watcher.on('all', (event, relativeEntry) => {
					const entry = new URL(relativeEntry, root);
					if (filesToWatch.some((f) => entry.href === f.href)) {
						server.restart();
					}
				});
			},
			'astro:build:start': async ({ logger }) => {
				if (
					!connectToStudio &&
					!databaseFileEnvDefined() &&
					(output === 'server' || output === 'hybrid')
				) {
					const message = `Attempting to build without the --remote flag or the ASTRO_DATABASE_FILE environment variable defined. You probably want to pass --remote to astro build.`;
					const hint =
						'Learn more connecting to Studio: https://docs.astro.build/en/guides/astro-db/#connect-to-astro-studio';
					throw new AstroError(message, hint);
				}

				logger.info('database: ' + (connectToStudio ? yellow('remote') : blue('local database.')));
			},
			'astro:build:done': async ({}) => {
				await appToken?.destroy();
			},
		},
	};
}

function databaseFileEnvDefined() {
	const env = loadEnv('', process.cwd());
	return env.ASTRO_DATABASE_FILE != null || process.env.ASTRO_DATABASE_FILE != null;
}

export function integration(): AstroIntegration[] {
	return [astroDBIntegration(), fileURLIntegration()];
}

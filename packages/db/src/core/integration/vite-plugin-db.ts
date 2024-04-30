import { fileURLToPath } from 'node:url';
import type { AstroConfig, AstroIntegrationLogger } from 'astro';
import { normalizePath } from 'vite';
import { SEED_DEV_FILE_NAME } from '../../runtime/queries.js';
import { DB_PATH, RUNTIME_IMPORT, RUNTIME_VIRTUAL_IMPORT, VIRTUAL_MODULE_ID } from '../consts.js';
import type { DBTables } from '../types.js';
import { type VitePlugin, getDbDirectoryUrl, getRemoteDatabaseUrl, getAstroEnv } from '../utils.js';
import { createLocalDatabaseClient } from '../../runtime/db-client.js';
import { recreateTables } from '../../runtime/seed-local.js';
import { executeSeedFile } from '../cli/commands/execute/index.js';
import { existsSync } from 'node:fs';
import { normalizeDatabaseUrl } from '../../runtime/index.js';

const WITH_SEED_VIRTUAL_MODULE_ID = 'astro:db:seed';

export const resolved = {
	virtual: '\0' + VIRTUAL_MODULE_ID,
	seedVirtual: '\0' + WITH_SEED_VIRTUAL_MODULE_ID,
};

export type LateTables = {
	get: () => DBTables;
};
export type LateSeedFiles = {
	get: () => Array<string | URL>;
};

type VitePluginDBParams =
	| {
			connectToStudio: false;
			tables: LateTables;
			seedFiles: LateSeedFiles;
			srcDir: URL;
			root: URL;
			logger?: AstroIntegrationLogger;
			output: AstroConfig['output'];
	  }
	| {
			connectToStudio: true;
			tables: LateTables;
			appToken: string;
			srcDir: URL;
			root: URL;
			output: AstroConfig['output'];
	  };

export function vitePluginDb(params: VitePluginDBParams): VitePlugin {
	const dbDirPath = normalizePath(fileURLToPath(getDbDirectoryUrl(params.root)));
	let command: 'build' | 'serve' = 'build';
	return {
		name: 'astro:db',
		enforce: 'pre',
		configResolved(resolvedConfig) {
			command = resolvedConfig.command;
		},
		async resolveId(id) {
			if (id !== VIRTUAL_MODULE_ID) return;
			return resolved.virtual;
		},
		async load(id) {
			if (id !== resolved.virtual && id !== resolved.seedVirtual) return;

			if (params.connectToStudio) {
				return getStudioVirtualModContents({
					appToken: params.appToken,
					tables: params.tables.get(),
					isBuild: command === 'build',
					output: params.output,
				});
			}
			const tables = params.tables.get() ?? {};
			const { ASTRO_DATABASE_FILE } = getAstroEnv();
			const dbUrl = normalizeDatabaseUrl(ASTRO_DATABASE_FILE, new URL(DB_PATH, params.root).href);
			const db = createLocalDatabaseClient({ dbUrl });
			await recreateTables({ db, tables: params.tables.get() ?? {} });

			const localSeedPaths = SEED_DEV_FILE_NAME.map(
				(name) => new URL(name, getDbDirectoryUrl(params.root))
			);
			const integrationSeedPaths = params.seedFiles
				.get()
				// TODO: add resolver for package paths
				.map((s) => (typeof s === 'string' && s.startsWith('.') ? new URL(s, params.root) : s))
				.filter((s): s is URL => s instanceof URL);
			const seedFiles = [...integrationSeedPaths, ...localSeedPaths];
			let hasSeeded = false;
			for await (const seedFile of seedFiles) {
				// Invalidate the `astro:db` module when a seed file changes.
				this.addWatchFile(fileURLToPath(seedFile));
				if (existsSync(seedFile)) {
					hasSeeded = true;
					await executeSeedFile({ tables, fileUrl: seedFile, root: params.root });
				}
			}
			if (hasSeeded) {
				// TODO: format log
				(params.logger ?? console).info('Seeded database.');
			}
			return getLocalVirtualModContents({
				root: params.root,
				tables: params.tables.get(),
			});
		},
	};
}

export function getConfigVirtualModContents() {
	return `export * from ${RUNTIME_VIRTUAL_IMPORT}`;
}

export function getLocalVirtualModContents({
	tables,
	root,
}: {
	tables: DBTables;
	root: URL;
}) {
	const dbUrl = new URL(DB_PATH, root);
	return `
import { asDrizzleTable, createLocalDatabaseClient, normalizeDatabaseUrl } from ${RUNTIME_IMPORT};

const dbUrl = normalizeDatabaseUrl(import.meta.env.ASTRO_DATABASE_FILE, ${JSON.stringify(dbUrl)});
export const db = createLocalDatabaseClient({ dbUrl });

export * from ${RUNTIME_VIRTUAL_IMPORT};

${getStringifiedTableExports(tables)}`;
}

export function getStudioVirtualModContents({
	tables,
	appToken,
	isBuild,
	output,
}: {
	tables: DBTables;
	appToken: string;
	isBuild: boolean;
	output: AstroConfig['output'];
}) {
	function appTokenArg() {
		if (isBuild) {
			if (output === 'server') {
				// In production build, always read the runtime environment variable.
				return 'process.env.ASTRO_STUDIO_APP_TOKEN';
			} else {
				// Static mode or prerendering needs the local app token.
				return `process.env.ASTRO_STUDIO_APP_TOKEN ?? ${JSON.stringify(appToken)}`;
			}
		} else {
			return JSON.stringify(appToken);
		}
	}

	function dbUrlArg() {
		const dbStr = JSON.stringify(getRemoteDatabaseUrl());
		// Allow overriding, mostly for testing
		return `import.meta.env.ASTRO_STUDIO_REMOTE_DB_URL ?? ${dbStr}`;
	}

	return `
import {asDrizzleTable, createRemoteDatabaseClient} from ${RUNTIME_IMPORT};

export const db = await createRemoteDatabaseClient(${appTokenArg()}, ${dbUrlArg()});

export * from ${RUNTIME_VIRTUAL_IMPORT};

${getStringifiedTableExports(tables)}
	`;
}

function getStringifiedTableExports(tables: DBTables) {
	return Object.entries(tables)
		.map(
			([name, table]) =>
				`export const ${name} = asDrizzleTable(${JSON.stringify(name)}, ${JSON.stringify(
					table
				)}, false)`
		)
		.join('\n');
}

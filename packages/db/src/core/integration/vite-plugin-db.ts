import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AstroConfig, AstroIntegrationLogger } from 'astro';
import { type SQL, sql } from 'drizzle-orm';
import { SQLiteAsyncDialect } from 'drizzle-orm/sqlite-core';
import { normalizeDatabaseUrl } from '../../runtime/index.js';
import {
	DB_CLIENTS,
	DB_PATH,
	RUNTIME_IMPORT,
	RUNTIME_VIRTUAL_IMPORT,
	VIRTUAL_CLIENT_MODULE_ID,
	VIRTUAL_MODULE_ID,
} from '../consts.js';
import { createClient } from '../db-client/libsql-local.js';
import { getResolvedFileUrl } from '../load-file.js';
import { getCreateIndexQueries, getCreateTableQuery, SEED_DEV_FILE_NAME } from '../queries.js';
import type { DBTables } from '../types.js';
import {
	getAstroEnv,
	getDbDirectoryUrl,
	getRemoteDatabaseInfo,
	type VitePlugin,
} from '../utils.js';

const resolved = {
	module: '\0' + VIRTUAL_MODULE_ID,
	importedFromSeedFile: '\0' + VIRTUAL_MODULE_ID + ':seed',
};

export type LateTables = {
	get: () => DBTables;
};
export type LateSeedFiles = {
	get: () => Array<string | URL>;
};
export type SeedHandler = {
	inProgress: boolean;
	execute: (fileUrl: URL) => Promise<void>;
};

type VitePluginDBParams =
	| {
			connectToRemote: false;
			tables: LateTables;
			seedFiles: LateSeedFiles;
			srcDir: URL;
			root: URL;
			logger?: AstroIntegrationLogger;
			output: AstroConfig['output'];
			seedHandler: SeedHandler;
	  }
	| {
			connectToRemote: true;
			tables: LateTables;
			appToken: string;
			srcDir: URL;
			root: URL;
			output: AstroConfig['output'];
			seedHandler: SeedHandler;
	  };

export function vitePluginDb(params: VitePluginDBParams): VitePlugin {
	let command: 'build' | 'serve' = 'build';
	return {
		name: 'astro:db',
		enforce: 'pre',
		configResolved(resolvedConfig) {
			command = resolvedConfig.command;
		},
		async resolveId(id) {
			if (id !== VIRTUAL_MODULE_ID) return;
			if (params.seedHandler.inProgress) {
				return resolved.importedFromSeedFile;
			}
			return resolved.module;
		},
		async load(id) {
			if (id !== resolved.module && id !== resolved.importedFromSeedFile) return;

			if (params.connectToRemote) {
				return getRemoteVirtualModContents({
					appToken: params.appToken,
					tables: params.tables.get(),
					isBuild: command === 'build',
					output: params.output,
					localExecution: false,
				});
			}

			// When seeding, we resolved to a different virtual module.
			// this prevents an infinite loop attempting to rerun seed files.
			// Short circuit with the module contents in this case.
			if (id === resolved.importedFromSeedFile) {
				return getLocalVirtualModContents({
					root: params.root,
					tables: params.tables.get(),
					localExecution: false,
				});
			}

			await recreateTables(params);
			const seedFiles = getResolvedSeedFiles(params);
			for await (const seedFile of seedFiles) {
				// Use `addWatchFile()` to invalidate the `astro:db` module
				// when a seed file changes.
				this.addWatchFile(fileURLToPath(seedFile));
				if (existsSync(seedFile)) {
					params.seedHandler.inProgress = true;
					await params.seedHandler.execute(seedFile);
				}
			}
			if (params.seedHandler.inProgress) {
				(params.logger ?? console).info('Seeded database.');
				params.seedHandler.inProgress = false;
			}
			return getLocalVirtualModContents({
				root: params.root,
				tables: params.tables.get(),
				localExecution: false,
			});
		},
	};
}

export function getConfigVirtualModContents() {
	return `export * from ${RUNTIME_VIRTUAL_IMPORT}`;
}

/**
 * Get the module import for the DB client.
 * This is used to pick which module to import based on whether
 * the DB client is being used by the CLI, or in the Astro runtime.
 *
 * This is important for the `astro db execute` command to work correctly.
 *
 * @param localExecution - Whether the DB client is being used in a local execution context (e.g. CLI commands).
 * @returns The module import string for the DB client.
 */
function getDBModule(localExecution: boolean) {
	return localExecution
		? `import { createClient } from '${DB_CLIENTS.node}';`
		: `import { createClient } from '${VIRTUAL_CLIENT_MODULE_ID}';`;
}

export function getLocalVirtualModContents({
	tables,
	root,
	localExecution,
}: {
	tables: DBTables;
	root: URL;
	/**
	 * Used for the execute command to import the client directly.
	 * In other cases, we use the runtime only vite virtual module.
	 *
	 * This is used to ensure that the client is imported correctly
	 * when executing commands like `astro db execute`.
	 */
	localExecution: boolean;
}) {
	const { ASTRO_DATABASE_FILE } = getAstroEnv();
	const dbUrl = new URL(DB_PATH, root);

	// If this is for the execute command, we need to import the client directly instead of using the runtime only virtual module.
	const clientImport = getDBModule(localExecution);

	return `
import { asDrizzleTable, normalizeDatabaseUrl } from ${RUNTIME_IMPORT};

${clientImport}

const dbUrl = normalizeDatabaseUrl(${JSON.stringify(ASTRO_DATABASE_FILE)}, ${JSON.stringify(dbUrl)});
export const db = createClient({ url: dbUrl });

export * from ${RUNTIME_VIRTUAL_IMPORT};

${getStringifiedTableExports(tables)}`;
}

export function getRemoteVirtualModContents({
	tables,
	appToken,
	isBuild,
	output,
	localExecution,
}: {
	tables: DBTables;
	appToken: string;
	isBuild: boolean;
	output: AstroConfig['output'];
	/**
	 * Used for the execute command to import the client directly.
	 * In other cases, we use the runtime only vite virtual module.
	 *
	 * This is used to ensure that the client is imported correctly
	 * when executing commands like `astro db execute`.
	 */
	localExecution: boolean;
}) {
	const dbInfo = getRemoteDatabaseInfo();

	function appTokenArg() {
		if (isBuild) {
			if (output === 'server') {
				// In production build, always read the runtime environment variable.
				return `process.env.ASTRO_DB_APP_TOKEN`;
			} else {
				// Static mode or prerendering needs the local app token.
				return `process.env.ASTRO_DB_APP_TOKEN ?? ${JSON.stringify(appToken)}`;
			}
		} else {
			return JSON.stringify(appToken);
		}
	}

	function dbUrlArg() {
		const dbStr = JSON.stringify(dbInfo.url);

		if (isBuild) {
			// Allow overriding, mostly for testing
			return `import.meta.env.ASTRO_DB_REMOTE_URL ?? ${dbStr}`;
		} else {
			return dbStr;
		}
	}

	// If this is for the execute command, we need to import the client directly instead of using the runtime only virtual module.
	const clientImport = getDBModule(localExecution);

	return `
import {asDrizzleTable} from ${RUNTIME_IMPORT};

${clientImport}

export const db = await createClient({
  url: ${dbUrlArg()},
  token: ${appTokenArg()},
});

export * from ${RUNTIME_VIRTUAL_IMPORT};

${getStringifiedTableExports(tables)}
	`;
}

function getStringifiedTableExports(tables: DBTables) {
	return Object.entries(tables)
		.map(
			([name, table]) =>
				`export const ${name} = asDrizzleTable(${JSON.stringify(name)}, ${JSON.stringify(
					table,
				)}, false)`,
		)
		.join('\n');
}

const sqlite = new SQLiteAsyncDialect();

async function recreateTables({ tables, root }: { tables: LateTables; root: URL }) {
	const { ASTRO_DATABASE_FILE } = getAstroEnv();
	const dbUrl = normalizeDatabaseUrl(ASTRO_DATABASE_FILE, new URL(DB_PATH, root).href);
	const db = createClient({ url: dbUrl });
	const setupQueries: SQL[] = [];
	for (const [name, table] of Object.entries(tables.get() ?? {})) {
		const dropQuery = sql.raw(`DROP TABLE IF EXISTS ${sqlite.escapeName(name)}`);
		const createQuery = sql.raw(getCreateTableQuery(name, table));
		const indexQueries = getCreateIndexQueries(name, table);
		setupQueries.push(dropQuery, createQuery, ...indexQueries.map((s) => sql.raw(s)));
	}
	await db.batch([
		db.run(sql`pragma defer_foreign_keys=true;`),
		...setupQueries.map((q) => db.run(q)),
	]);
}

function getResolvedSeedFiles({ root, seedFiles }: { root: URL; seedFiles: LateSeedFiles }) {
	const localSeedFiles = SEED_DEV_FILE_NAME.map((name) => new URL(name, getDbDirectoryUrl(root)));
	const integrationSeedFiles = seedFiles.get().map((s) => getResolvedFileUrl(root, s));
	return [...integrationSeedFiles, ...localSeedFiles];
}

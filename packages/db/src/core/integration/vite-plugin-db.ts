import { fileURLToPath } from 'node:url';
import type { AstroConfig, AstroIntegrationLogger } from 'astro';
import { normalizePath } from 'vite';
import { SEED_DEV_FILE_NAME, getCreateIndexQueries, getCreateTableQuery } from '../queries.js';
import { DB_PATH, RUNTIME_IMPORT, RUNTIME_VIRTUAL_IMPORT, VIRTUAL_MODULE_ID } from '../consts.js';
import type { DBTables } from '../types.js';
import { type VitePlugin, getDbDirectoryUrl, getRemoteDatabaseUrl, getAstroEnv } from '../utils.js';
import { createLocalDatabaseClient } from '../../runtime/db-client.js';
import { type SQL, sql } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { existsSync } from 'node:fs';
import { normalizeDatabaseUrl } from '../../runtime/index.js';
import { bundleFile, getResolvedFileUrl, importBundledFile } from '../load-file.js';
import { SQLiteAsyncDialect } from 'drizzle-orm/sqlite-core';
import { EXEC_DEFAULT_EXPORT_ERROR, EXEC_ERROR } from '../errors.js';
import { LibsqlError } from '@libsql/client';
import { AstroDbError } from '../../runtime/utils.js';

export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

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
			if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
		},
		async load(id) {
			if (id !== RESOLVED_VIRTUAL_MODULE_ID) return;

			if (params.connectToStudio) {
				return getStudioVirtualModContents({
					appToken: params.appToken,
					tables: params.tables.get(),
					isBuild: command === 'build',
					output: params.output,
				});
			}
			await recreateTables(params);
			const seedFiles = getResolvedSeedFiles(params);
			let hasSeeded = false;
			for await (const seedFile of seedFiles) {
				// Use `addWatchFile()` to invalidate the `astro:db` module
				// when a seed file changes.
				this.addWatchFile(fileURLToPath(seedFile));
				if (existsSync(seedFile)) {
					hasSeeded = true;
					await executeSeedFile({
						tables: params.tables.get() ?? {},
						fileUrl: seedFile,
						root: params.root,
					});
				}
			}
			if (hasSeeded) {
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

const sqlite = new SQLiteAsyncDialect();

async function recreateTables({ tables, root }: { tables: LateTables; root: URL }) {
	const { ASTRO_DATABASE_FILE } = getAstroEnv();
	const dbUrl = normalizeDatabaseUrl(ASTRO_DATABASE_FILE, new URL(DB_PATH, root).href);
	const db = createLocalDatabaseClient({ dbUrl });
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

function getResolvedSeedFiles({
	root,
	seedFiles,
}: {
	root: URL;
	seedFiles: LateSeedFiles;
}) {
	const localSeedFiles = SEED_DEV_FILE_NAME.map((name) => new URL(name, getDbDirectoryUrl(root)));
	const integrationSeedFiles = seedFiles.get().map((s) => getResolvedFileUrl(root, s));
	return [...integrationSeedFiles, ...localSeedFiles];
}

async function executeSeedFile({
	tables,
	root,
	fileUrl,
}: {
	tables: DBTables;
	root: URL;
	fileUrl: URL;
}) {
	const virtualModContents = getLocalVirtualModContents({
		tables: tables ?? {},
		root,
	});
	const { code } = await bundleFile({ virtualModContents, root, fileUrl });
	const mod = await importBundledFile({ code, root });
	if (typeof mod.default !== 'function') {
		throw new AstroDbError(EXEC_DEFAULT_EXPORT_ERROR(fileURLToPath(fileUrl)));
	}
	try {
		await mod.default();
	} catch (e) {
		if (e instanceof LibsqlError) {
			throw new AstroDbError(EXEC_ERROR(e.message));
		}
		throw e;
	}
}

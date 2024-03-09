import { fileURLToPath } from 'node:url';
import { type SQL, sql } from 'drizzle-orm';
import { SQLiteAsyncDialect } from 'drizzle-orm/sqlite-core';
import { normalizePath } from 'vite';
import { createLocalDatabaseClient } from '../../runtime/db-client.js';
import type { SqliteDB } from '../../runtime/index.js';
import {
	SEED_DEV_FILE_NAME,
	getCreateIndexQueries,
	getCreateTableQuery,
} from '../../runtime/queries.js';
import { DB_PATH, RUNTIME_CONFIG_IMPORT, RUNTIME_IMPORT, VIRTUAL_MODULE_ID } from '../consts.js';
import type { DBTables } from '../types.js';
import { type VitePlugin, getDbDirectoryUrl, getRemoteDatabaseUrl } from '../utils.js';

const WITH_SEED_VIRTUAL_MODULE_ID = 'astro:db:seed';

const resolved = {
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
	  }
	| {
			connectToStudio: true;
			tables: LateTables;
			appToken: string;
			srcDir: URL;
			root: URL;
	  };

const normalizeRelativePath = (path: string, root: URL) =>
	normalizePath(fileURLToPath(new URL(path, root)));

const normalizeIntegrationSeedPaths = (seedFiles: Array<string | URL>, root: URL) =>
	seedFiles.map((pathOrUrl) =>
		typeof pathOrUrl === 'string'
			? pathOrUrl.startsWith('.')
				? normalizeRelativePath(pathOrUrl, root)
				: pathOrUrl
			: pathOrUrl.pathname
	);

export function vitePluginDb(params: VitePluginDBParams): VitePlugin {
	const srcDirPath = normalizePath(fileURLToPath(params.srcDir));
	const seedFilePaths = SEED_DEV_FILE_NAME.map((name) =>
		normalizeRelativePath(name, getDbDirectoryUrl(params.root))
	);
	let integrationSeedFilePaths: Array<string>;
	return {
		name: 'astro:db',
		enforce: 'pre',
		async resolveId(id, rawImporter) {
			if (id !== VIRTUAL_MODULE_ID) return;
			if (params.connectToStudio) return resolved.virtual;

			const importer = rawImporter ? await this.resolve(rawImporter) : null;
			if (!importer) return resolved.virtual;

			if (importer.id.startsWith(srcDirPath)) {
				// Seed only if the importer is in the src directory.
				// Otherwise, we may get recursive seed calls (ex. import from db/seed.ts).
				return resolved.seedVirtual;
			}
			return resolved.virtual;
		},
		async load(id) {
			if (!params.connectToStudio && !integrationSeedFilePaths) {
				integrationSeedFilePaths = normalizeIntegrationSeedPaths(
					params.seedFiles.get(),
					params.root
				);
			}
			// Recreate tables whenever a seed file is loaded.
			if (seedFilePaths.includes(id) || integrationSeedFilePaths?.includes(id)) {
				await recreateTables({
					db: createLocalDatabaseClient({ dbUrl: new URL(DB_PATH, params.root).href }),
					tables: params.tables.get(),
				});
			}

			if (id !== resolved.virtual && id !== resolved.seedVirtual) return;

			if (params.connectToStudio) {
				return getStudioVirtualModContents({
					appToken: params.appToken,
					tables: params.tables.get(),
				});
			}
			return getLocalVirtualModContents({
				root: params.root,
				tables: params.tables.get(),
				seedFiles: integrationSeedFilePaths,
				shouldSeed: id === resolved.seedVirtual,
			});
		},
	};
}

export function getConfigVirtualModContents() {
	return `export * from ${RUNTIME_CONFIG_IMPORT}`;
}

export function getLocalVirtualModContents({
	tables,
	root,
	seedFiles,
	shouldSeed,
}: {
	tables: DBTables;
	seedFiles: string[];
	root: URL;
	shouldSeed: boolean;
}) {
	const userSeedFilePaths = SEED_DEV_FILE_NAME.map(
		// Format as /db/[name].ts
		// for Vite import.meta.glob
		(name) => new URL(name, getDbDirectoryUrl('file:///')).pathname
	);
	// Use top-level imports to correctly resolve `astro:db` within seed files.
	// Dynamic imports cause a silent build failure,
	// potentially because of circular module references.
	const integrationSeedImportStatements: string[] = [];
	const integrationSeedImportNames: string[] = [];
	seedFiles.forEach((path, index) => {
		const importName = 'integration_seed_' + index;
		integrationSeedImportStatements.push(`import ${importName} from ${JSON.stringify(path)};`);
		integrationSeedImportNames.push(importName);
	});

	const dbUrl = new URL(DB_PATH, root);
	return `
import { asDrizzleTable, createLocalDatabaseClient } from ${RUNTIME_IMPORT};
${shouldSeed ? `import { seedLocal } from ${RUNTIME_IMPORT};` : ''}
${shouldSeed ? integrationSeedImportStatements.join('\n') : ''}

const dbUrl = ${JSON.stringify(dbUrl)};
export const db = createLocalDatabaseClient({ dbUrl });

${
	shouldSeed
		? `await seedLocal({
	userSeedGlob: import.meta.glob(${JSON.stringify(userSeedFilePaths)}, { eager: true }),
	integrationSeedFunctions: [${integrationSeedImportNames.join(',')}],
});`
		: ''
}

export * from ${RUNTIME_CONFIG_IMPORT};

${getStringifiedCollectionExports(tables)}`;
}

export function getStudioVirtualModContents({
	tables,
	appToken,
}: {
	tables: DBTables;
	appToken: string;
}) {
	return `
import {asDrizzleTable, createRemoteDatabaseClient} from ${RUNTIME_IMPORT};

export const db = await createRemoteDatabaseClient(${JSON.stringify(
		appToken
		// Respect runtime env for user overrides in SSR
	)}, import.meta.env.ASTRO_STUDIO_REMOTE_DB_URL ?? ${JSON.stringify(getRemoteDatabaseUrl())});

export * from ${RUNTIME_CONFIG_IMPORT};

${getStringifiedCollectionExports(tables)}
	`;
}

function getStringifiedCollectionExports(tables: DBTables) {
	return Object.entries(tables)
		.map(
			([name, collection]) =>
				`export const ${name} = asDrizzleTable(${JSON.stringify(name)}, ${JSON.stringify(
					collection
				)}, false)`
		)
		.join('\n');
}

const sqlite = new SQLiteAsyncDialect();

async function recreateTables({ db, tables }: { db: SqliteDB; tables: DBTables }) {
	const setupQueries: SQL[] = [];
	for (const [name, table] of Object.entries(tables)) {
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

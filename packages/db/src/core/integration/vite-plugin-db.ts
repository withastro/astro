import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePath } from 'vite';
import { SEED_DEV_FILE_NAME } from '../../runtime/queries.js';
import {
	DB_PATH,
	RUNTIME_CONFIG_IMPORT,
	RUNTIME_DRIZZLE_IMPORT,
	RUNTIME_IMPORT,
	VIRTUAL_MODULE_ID,
} from '../consts.js';
import type { DBTables } from '../types.js';
import { type VitePlugin, getDbDirectoryUrl, getRemoteDatabaseUrl } from '../utils.js';

const LOCAL_DB_VIRTUAL_MODULE_ID = 'astro:local';

const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;
const resolvedLocalDbVirtualModuleId = LOCAL_DB_VIRTUAL_MODULE_ID + '/local-db';
const resolvedSeedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID + '?shouldSeed';

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

export function vitePluginDb(params: VitePluginDBParams): VitePlugin {
	const srcDirPath = normalizePath(fileURLToPath(params.srcDir));
	return {
		name: 'astro:db',
		enforce: 'pre',
		async resolveId(id, rawImporter) {
			if (id === LOCAL_DB_VIRTUAL_MODULE_ID) return resolvedLocalDbVirtualModuleId;
			if (id !== VIRTUAL_MODULE_ID) return;
			if (params.connectToStudio) return resolvedVirtualModuleId;

			const importer = rawImporter ? await this.resolve(rawImporter) : null;
			if (!importer) return resolvedVirtualModuleId;

			if (importer.id.startsWith(srcDirPath)) {
				// Seed only if the importer is in the src directory.
				// Otherwise, we may get recursive seed calls (ex. import from db/seed.ts).
				return resolvedSeedVirtualModuleId;
			}
			return resolvedVirtualModuleId;
		},
		load(id) {
			if (id === resolvedLocalDbVirtualModuleId) {
				const dbUrl = new URL(DB_PATH, params.root);
				return `import { createLocalDatabaseClient } from ${RUNTIME_IMPORT};
				const dbUrl = ${JSON.stringify(dbUrl)};

				export const db = createLocalDatabaseClient({ dbUrl });`;
			}

			if (id !== resolvedVirtualModuleId && id !== resolvedSeedVirtualModuleId) return;

			if (params.connectToStudio) {
				return getStudioVirtualModContents({
					appToken: params.appToken,
					tables: params.tables.get(),
				});
			}
			return getLocalVirtualModContents({
				root: params.root,
				tables: params.tables.get(),
				seedFiles: params.seedFiles.get(),
				shouldSeed: id === resolvedSeedVirtualModuleId,
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
	seedFiles: Array<string | URL>;
	root: URL;
	shouldSeed: boolean;
}) {
	const userSeedFilePaths = SEED_DEV_FILE_NAME.map(
		// Format as /db/[name].ts
		// for Vite import.meta.glob
		(name) => new URL(name, getDbDirectoryUrl('file:///')).pathname
	);
	const resolveId = (id: string) => (id.startsWith('.') ? resolve(fileURLToPath(root), id) : id);
	const integrationSeedFilePaths = seedFiles.map((pathOrUrl) =>
		typeof pathOrUrl === 'string' ? resolveId(pathOrUrl) : pathOrUrl.pathname
	);
	const integrationSeedImports = integrationSeedFilePaths.map(
		(filePath) => `() => import(${JSON.stringify(filePath)})`
	);
	return `
import { asDrizzleTable, seedLocal } from ${RUNTIME_IMPORT};
import { db as _db } from ${JSON.stringify(LOCAL_DB_VIRTUAL_MODULE_ID)};

export const db = _db;

${
	shouldSeed
		? `await seedLocal({
	db: _db,
	tables: ${JSON.stringify(tables)},
	userSeedGlob: import.meta.glob(${JSON.stringify(userSeedFilePaths)}),
	integrationSeedImports: [${integrationSeedImports.join(',')}],
});`
		: ''
}

export * from ${RUNTIME_DRIZZLE_IMPORT};
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
export * from ${RUNTIME_DRIZZLE_IMPORT};
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

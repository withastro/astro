import { fileURLToPath } from 'node:url';
import { SEED_DEV_FILE_NAMES_SORTED } from '../../runtime/queries.js';
import {
	DB_PATH,
	RUNTIME_CONFIG_IMPORT,
	RUNTIME_DRIZZLE_IMPORT,
	RUNTIME_IMPORT,
	VIRTUAL_MODULE_ID,
} from '../consts.js';
import type { DBTables } from '../types.js';
import { getDbDirectoryUrl, getRemoteDatabaseUrl, type VitePlugin } from '../utils.js';
import { normalizePath } from 'vite';

const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;
const resolvedSeedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID + '?shouldSeed';

export type LateTables = {
	get: () => DBTables;
};

type VitePluginDBParams =
	| {
			connectToStudio: false;
			tables: LateTables;
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
	shouldSeed,
}: {
	tables: DBTables;
	root: URL;
	shouldSeed: boolean;
}) {
	const dbUrl = new URL(DB_PATH, root);
	const seedFilePaths = SEED_DEV_FILE_NAMES_SORTED.map(
		// Format as /db/[name].ts
		// for Vite import.meta.glob
		(name) => new URL(name, getDbDirectoryUrl('file:///')).pathname
	);

	return `
import { asDrizzleTable, createLocalDatabaseClient, seedLocal } from ${RUNTIME_IMPORT};
const dbUrl = ${JSON.stringify(dbUrl)};

export const db = createLocalDatabaseClient({ dbUrl });

${
	shouldSeed
		? `await seedLocal({
	db,
	tables: ${JSON.stringify(tables)},
	fileGlob: import.meta.glob(${JSON.stringify(seedFilePaths)}),
})`
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

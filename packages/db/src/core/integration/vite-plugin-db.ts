import { existsSync } from 'node:fs';
import {
	DB_PATH,
	RUNTIME_DRIZZLE_IMPORT,
	RUNTIME_IMPORT,
	SEED_DEV_FILE_NAMES,
	VIRTUAL_MODULE_ID,
} from '../consts.js';
import type { DBTables } from '../types.js';
import { getDbDirUrl, getRemoteDatabaseUrl, type VitePlugin } from '../utils.js';
import { fileURLToPath } from 'node:url';

const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

type LateSchema = {
	tables: () => DBTables;
};

type VitePluginDBParams =
	| {
			connectToStudio: false;
			isDev: boolean;
			schemas: LateSchema;
			root: URL;
	  }
	| {
			connectToStudio: true;
			schemas: LateSchema;
			appToken: string;
			root: URL;
	  };

export function vitePluginDb(params: VitePluginDBParams): VitePlugin {
	return {
		name: 'astro:db',
		enforce: 'pre',
		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return resolvedVirtualModuleId;
			}
		},
		load(id) {
			if (id !== resolvedVirtualModuleId) return;

			if (params.connectToStudio) {
				return getStudioVirtualModContents({
					appToken: params.appToken,
					tables: params.schemas.tables(),
				});
			}
			return getLocalVirtualModContents({
				root: params.root,
				tables: params.schemas.tables(),
				isDev: params.isDev,
			});
		},
	};
}

export function getLocalVirtualModContents({
	tables,
	root,
	isDev,
}: {
	tables: DBTables;
	root: URL;
	isDev: boolean;
}) {
	const dbUrl = new URL(DB_PATH, root);
	const devSeedFile = SEED_DEV_FILE_NAMES.map((f) =>
		fileURLToPath(new URL(f, getDbDirUrl(root)))
	).find((f) => existsSync(f));

	return `
import { collectionToTable, createLocalDatabaseClient, seedDev } from ${RUNTIME_IMPORT};
import dbUrl from ${JSON.stringify(`${dbUrl}?fileurl`)};

export const db = await createLocalDatabaseClient({ dbUrl });

export * from ${RUNTIME_DRIZZLE_IMPORT};

${getStringifiedCollectionExports(tables)}

// TODO: test error logging to see if try / catch is needed
${
	isDev && devSeedFile
		? `await seedDev({
	db,
	tables: ${JSON.stringify(tables)},
	runSeed: () => import(${JSON.stringify(devSeedFile)}),
});`
		: ''
}
`;
}

export function getStudioVirtualModContents({
	tables,
	appToken,
}: {
	tables: DBTables;
	appToken: string;
}) {
	return `
import {collectionToTable, createRemoteDatabaseClient} from ${RUNTIME_IMPORT};

export const db = await createRemoteDatabaseClient(${JSON.stringify(
		appToken
		// Respect runtime env for user overrides in SSR
	)}, import.meta.env.ASTRO_STUDIO_REMOTE_DB_URL ?? ${JSON.stringify(getRemoteDatabaseUrl())});
export * from ${RUNTIME_DRIZZLE_IMPORT};

${getStringifiedCollectionExports(tables)}
	`;
}

function getStringifiedCollectionExports(tables: DBTables) {
	return Object.entries(tables)
		.map(
			([name, collection]) =>
				`export const ${name} = collectionToTable(${JSON.stringify(name)}, ${JSON.stringify(
					collection
				)}, false)`
		)
		.join('\n');
}

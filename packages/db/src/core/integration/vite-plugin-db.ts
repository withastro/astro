import { DB_PATH, RUNTIME_DRIZZLE_IMPORT, RUNTIME_IMPORT, VIRTUAL_MODULE_ID } from '../consts.js';
import type { DBTables } from '../types.js';
import type { VitePlugin } from '../utils.js';

const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

type LateSchema = {
	tables: () => DBTables;
};

type VitePluginDBParams =
	| {
			connectToStudio: false;
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
			return getVirtualModContents({
				root: params.root,
				tables: params.schemas.tables(),
			});
		},
	};
}

export function getVirtualModContents({ tables, root }: { tables: DBTables; root: URL }) {
	const dbUrl = new URL(DB_PATH, root);
	return `
import { collectionToTable, createLocalDatabaseClient } from ${RUNTIME_IMPORT};
import dbUrl from ${JSON.stringify(`${dbUrl}?fileurl`)};

const params = ${JSON.stringify({
		tables,
		seeding: false,
	})};
params.dbUrl = dbUrl;

export const db = await createLocalDatabaseClient(params);

export * from ${RUNTIME_DRIZZLE_IMPORT};

${getStringifiedCollectionExports(tables)}
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
	)}, import.meta.env.ASTRO_STUDIO_REMOTE_DB_URL);
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

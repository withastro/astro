import { RUNTIME_IMPORT, VIRTUAL_MODULE_ID, DB_PATH, RUNTIME_DRIZZLE_IMPORT } from '../consts.js';
import type { DBCollections } from '../types.js';
import type { VitePlugin } from '../utils.js';
import { fileURLToPath } from 'node:url';

const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

export function vitePluginDb(
	params:
		| {
				connectToStudio: false;
				collections: DBCollections;
				root: URL;
		  }
		| {
				connectToStudio: true;
				collections: DBCollections;
				appToken: string;
				root: URL;
		  }
): VitePlugin {
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
				return getStudioVirtualModContents(params);
			}
			return getVirtualModContents(params);
		},
	};
}

export function getVirtualModContents({ collections, root }: { collections: DBCollections; root: URL }) {
	const dbUrl = new URL(DB_PATH, root);
	return `
import { collectionToTable, createLocalDatabaseClient } from ${RUNTIME_IMPORT};
import dbUrl from '${fileURLToPath(dbUrl)}?fileurl';

const params = ${JSON.stringify({
		collections,
		seeding: false,
	})};
params.dbUrl = dbUrl;

export const db = await createLocalDatabaseClient(params);

export * from ${RUNTIME_DRIZZLE_IMPORT};

${getStringifiedCollectionExports(collections)}
`;
}

export function getStudioVirtualModContents({
	collections,
	appToken,
}: {
	collections: DBCollections;
	appToken: string;
}) {
	return `
import {collectionToTable, createRemoteDatabaseClient} from ${RUNTIME_IMPORT};

export const db = await createRemoteDatabaseClient(${JSON.stringify(
		appToken
	)}, import.meta.env.ASTRO_STUDIO_REMOTE_DB_URL);
export * from ${RUNTIME_DRIZZLE_IMPORT};

${getStringifiedCollectionExports(collections)}
	`;
}

function getStringifiedCollectionExports(collections: DBCollections) {
	return Object.entries(collections)
		.map(
			([name, collection]) =>
				`export const ${name} = collectionToTable(${JSON.stringify(name)}, ${JSON.stringify(
					collection
				)}, false)`
		)
		.join('\n');
}

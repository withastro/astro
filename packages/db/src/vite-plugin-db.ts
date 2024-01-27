import { DRIZZLE_MOD_IMPORT, INTERNAL_MOD_IMPORT, VIRTUAL_MODULE_ID, DB_PATH } from './consts.js';
import type { DBCollections } from './types.js';
import type { VitePlugin } from './utils.js';
import fs from 'node:fs';

const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

export function vitePluginDb(
	params:
		| {
				connectToStudio: false;
				collections: DBCollections;
				dbUrl: string;
		  }
		| {
				connectToStudio: true;
				collections: DBCollections;
				appToken: string;
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
		async buildEnd() {
			// For local use, emit the database into the output
			if ('dbUrl' in params) {
				const data = await fs.promises.readFile(new URL(params.dbUrl));
				this.emitFile({
					fileName: 'content.db',
					source: data,
					type: 'asset',
				});
			}
		},
	};
}

export function getVirtualModContents({
	collections,
	dbUrl,
}: {
	collections: DBCollections;
	dbUrl: string;
}) {
	return `
import { collectionToTable, createLocalDatabaseClient, findLocalDatabase } from ${INTERNAL_MOD_IMPORT};

export const dbUrl = findLocalDatabase(${JSON.stringify(dbUrl)});

const params = ${JSON.stringify({
		collections,
		seeding: false,
	})};
params.dbUrl = dbUrl;

export const db = await createLocalDatabaseClient(params);

export * from ${DRIZZLE_MOD_IMPORT};

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
import {collectionToTable, createRemoteDatabaseClient} from ${INTERNAL_MOD_IMPORT};

export const db = await createRemoteDatabaseClient(${JSON.stringify(
		appToken
	)}, import.meta.env.ASTRO_STUDIO_REMOTE_DB_URL);
export * from ${DRIZZLE_MOD_IMPORT};

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

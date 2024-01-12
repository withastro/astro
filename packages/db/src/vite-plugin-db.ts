import { existsSync } from 'node:fs';
import { DRIZZLE_MOD_IMPORT, INTERNAL_MOD_IMPORT, VIRTUAL_MODULE_ID, getDbUrl } from './consts.js';
import type { DBCollections } from './types.js';
import type { Plugin as VitePlugin } from 'vite';

const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

export function vitePluginDb({
	collections,
	root,
}: {
	collections: DBCollections;
	root: URL;
}): VitePlugin {
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
			return getVirtualModContents({ collections, root });
		},
	};
}

export function getVirtualModContents({
	collections,
	root,
}: {
	collections: DBCollections;
	root: URL;
}) {
	const dbUrl = getDbUrl(root).href;
	return `
import { collectionToTable, createDb } from ${INTERNAL_MOD_IMPORT};

export const db = await createDb(${JSON.stringify({
		collections,
		dbUrl,
		seeding: false,
	})});
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

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { red } from 'kleur/colors';
import {
	DRIZZLE_MOD_IMPORT,
	INTERNAL_MOD_IMPORT,
	SUPPORTED_SEED_FILES,
	VIRTUAL_MODULE_ID,
	getDbUrl,
} from './consts.js';
import type { DBCollections } from './types.js';
import type { Plugin as VitePlugin } from 'vite';

const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

export function vitePluginDb({
	collections,
	root,
	isDev,
}: {
	collections: DBCollections;
	root: URL;
	isDev: boolean;
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
			return getVirtualModContents({ collections, root, isDev });
		},
	};
}

const seedErrorMessage = `${red(
	'⚠️ Failed to seed data.'
)} Is the seed file out-of-date with recent schema changes?`;

export function getVirtualModContents({
	collections,
	root,
	isDev,
}: {
	collections: DBCollections;
	root: URL;
	isDev: boolean;
}) {
	const seedFile = SUPPORTED_SEED_FILES.map((f) => fileURLToPath(new URL(f, root))).find((f) =>
		existsSync(f)
	);
	const dbUrl = isDev ? ':memory:' : getDbUrl(root).href;
	const shouldSetUpDb = isDev || !existsSync(getDbUrl(root));
	return `
import { collectionToTable, createDb } from ${INTERNAL_MOD_IMPORT};

export const db = await createDb(${JSON.stringify({
		collections,
		dbUrl,
		createTables: shouldSetUpDb,
	})});
export * from ${DRIZZLE_MOD_IMPORT};

${getStringifiedCollectionExports(collections)}

${
	seedFile && isDev
		? `try {
	await import(${JSON.stringify(seedFile)});
} catch {
	console.error(${JSON.stringify(seedErrorMessage)});
}`
		: ''
}
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

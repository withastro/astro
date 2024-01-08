import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { DBCollections } from 'circle-rhyme-yes-measure';
import { red } from 'kleur/colors';
import {
	INTERNAL_LOCAL_PKG_IMP,
	INTERNAL_PKG_IMP,
	ROOT,
	SUPPORTED_SEED_FILES,
	VIRTUAL_MODULE_ID,
	drizzleFilterExps,
} from './consts.js';
import type { VitePlugin } from './utils.js';

const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

type Opts = { mode: 'dev' } | { mode: 'prod'; projectId: string; token: string };

export function vitePluginDb(collections: DBCollections, opts: Opts): VitePlugin {
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

			if (opts.mode === 'dev') {
				return getLocalVirtualModuleContents({ collections });
			}

			return getProdVirtualModuleContents({
				collections,
				projectId: opts.projectId,
				appToken: opts.token,
			});
		},
	};
}

const seedErrorMessage = `${red(
	'⚠️ Failed to seed data.',
)} Is the seed file out-of-date with recent schema changes?`;

export function getLocalVirtualModuleContents({ collections }: { collections: DBCollections }) {
	const seedFile = SUPPORTED_SEED_FILES.map((f) => fileURLToPath(new URL(f, ROOT))).find((f) =>
		existsSync(f),
	);
	return `
import { collectionToTable } from ${INTERNAL_PKG_IMP};
import { createLocalDb } from ${INTERNAL_LOCAL_PKG_IMP};

export const db = await createLocalDb(${JSON.stringify(collections)});
${drizzleFilterExps}

${getStringifiedCollectionExports(collections)}

${
	seedFile
		? `try {
	await import(${JSON.stringify(seedFile)});
} catch {
	console.error(${JSON.stringify(seedErrorMessage)});
}`
		: ''
}
`;
}

export function getProdVirtualModuleContents({
	collections,
	projectId,
	appToken,
}: {
	collections: DBCollections;
	projectId: string;
	appToken: string;
}) {
	return `
import { collectionToTable, createDb } from ${INTERNAL_PKG_IMP};

export const db = createDb(${JSON.stringify(projectId)}, ${JSON.stringify(appToken)});
${drizzleFilterExps}

${getStringifiedCollectionExports(collections)}
`;
}

function getStringifiedCollectionExports(collections: DBCollections) {
	return Object.entries(collections)
		.map(
			([name, collection]) =>
				`export const ${name} = collectionToTable(${JSON.stringify(name)}, ${JSON.stringify(
					collection,
				)}, false)`,
		)
		.join('\n');
}

// astro-head-inject
import {
	createCollectionToGlobResultMap,
	createGetCollection,
	createGetDataEntryById,
	createGetEntries,
	createGetEntry,
	createGetEntryBySlug,
	createReference,
} from 'astro/content/runtime';

export { z } from 'astro/zod';

const contentDir = '@@CONTENT_DIR@@';

const contentEntryGlob = import.meta.glob('@@CONTENT_ENTRY_GLOB_PATH@@', {
	query: { astroContentCollectionEntry: true },
});
const contentCollectionToEntryMap = createCollectionToGlobResultMap({
	globResult: contentEntryGlob,
	contentDir,
});

const dataEntryGlob = import.meta.glob('@@DATA_ENTRY_GLOB_PATH@@', {
	query: { astroDataCollectionEntry: true },
});
const dataCollectionToEntryMap = createCollectionToGlobResultMap({
	globResult: dataEntryGlob,
	contentDir,
});
const collectionToEntryMap = createCollectionToGlobResultMap({
	globResult: { ...contentEntryGlob, ...dataEntryGlob },
	contentDir,
});

let lookupMap = {};
/* @@LOOKUP_MAP_ASSIGNMENT@@ */

function createGlobLookup(glob) {
	return async (collection, lookupId) => {
		const filePath = lookupMap[collection]?.entries[lookupId];

		if (!filePath) return undefined;
		const res = glob[collection][filePath];
		console.log('res', res);
		return res;
	};
}

const renderEntryGlob = {
	'/src/content/docs/intro.mdoc': () => import('/src/content/docs/intro.mdoc'),
	'/src/content/docs/ben.mdoc': () => import('/src/content/docs/ben.mdoc'),
};
console.log('glob', renderEntryGlob);
const collectionToRenderEntryMap = createCollectionToGlobResultMap({
	globResult: renderEntryGlob,
	contentDir,
});

export function defineCollection(config) {
	if (!config.type) config.type = 'content';
	return config;
}

export const getCollection = createGetCollection({
	contentCollectionToEntryMap,
	dataCollectionToEntryMap,
	getRenderEntryImport: createGlobLookup(collectionToRenderEntryMap),
});

export const getEntryBySlug = createGetEntryBySlug({
	getEntryImport: createGlobLookup(contentCollectionToEntryMap),
	getRenderEntryImport: createGlobLookup(collectionToRenderEntryMap),
});

export const getDataEntryById = createGetDataEntryById({
	dataCollectionToEntryMap,
});

export const getEntry = createGetEntry({
	getEntryImport: createGlobLookup(collectionToEntryMap),
	getRenderEntryImport: createGlobLookup(collectionToRenderEntryMap),
});

export const getEntries = createGetEntries(getEntry);

export const reference = createReference({ lookupMap });

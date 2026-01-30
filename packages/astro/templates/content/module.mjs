// astro-head-inject
import {
	createCollectionToGlobResultMap,
	createGetCollection,
	createGetDataEntryById,
	createGetEntries,
	createGetEntry,
	createGetEntryBySlug,
	createGetLiveCollection,
	createGetLiveEntry,
	createReference,
} from 'astro/content/runtime';

export {
	defineCollection,
	defineLiveCollection,
	renderEntry as render,
} from 'astro/content/runtime';
export { z } from 'astro/zod';

/* @@LIVE_CONTENT_CONFIG@@ */

const contentDir = '@@CONTENT_DIR@@';

const contentEntryGlob = '@@CONTENT_ENTRY_GLOB_PATH@@';
const contentCollectionToEntryMap = createCollectionToGlobResultMap({
	globResult: contentEntryGlob,
	contentDir,
});

const dataEntryGlob = '@@DATA_ENTRY_GLOB_PATH@@';
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

const collectionNames = new Set(Object.keys(lookupMap));

function createGlobLookup(glob) {
	return async (collection, lookupId) => {
		const filePath = lookupMap[collection]?.entries[lookupId];

		if (!filePath) return undefined;
		return glob[collection][filePath];
	};
}

const renderEntryGlob = '@@RENDER_ENTRY_GLOB_PATH@@';
const collectionToRenderEntryMap = createCollectionToGlobResultMap({
	globResult: renderEntryGlob,
	contentDir,
});

const cacheEntriesByCollection = new Map();
export const getCollection = createGetCollection({
	contentCollectionToEntryMap,
	dataCollectionToEntryMap,
	getRenderEntryImport: createGlobLookup(collectionToRenderEntryMap),
	cacheEntriesByCollection,
	liveCollections,
});

export const getEntry = createGetEntry({
	getEntryImport: createGlobLookup(collectionToEntryMap),
	getRenderEntryImport: createGlobLookup(collectionToRenderEntryMap),
	collectionNames,
	liveCollections,
});

export const getEntryBySlug = createGetEntryBySlug({
	getEntryImport: createGlobLookup(contentCollectionToEntryMap),
	getRenderEntryImport: createGlobLookup(collectionToRenderEntryMap),
	collectionNames,
	getEntry,
});

export const getDataEntryById = createGetDataEntryById({
	getEntryImport: createGlobLookup(dataCollectionToEntryMap),
	collectionNames,
	getEntry,
});

export const getEntries = createGetEntries(getEntry);

export const reference = createReference({ lookupMap });

export const getLiveCollection = createGetLiveCollection({
	liveCollections,
});

export const getLiveEntry = createGetLiveEntry({
	liveCollections,
});

// astro-head-inject
import {
	createCollectionToGlobResultMap,
	createGetCollection,
	createGetDataCollection,
	createGetEntryBySlug,
	createGetDataEntryById,
} from 'astro/content/runtime';

export { z } from 'astro/zod';

export function defineCollection(config) {
	return Object.assign(config, { type: 'content' });
}

export function defineDataCollection(config) {
	return Object.assign(config, { type: 'data' });
}

// TODO: Remove this when having this fallback is no longer relevant. 2.3? 3.0? - erika, 2023-04-04
export const image = () => {
	throw new Error(
		'Importing `image()` from `astro:content` is no longer supported. See https://docs.astro.build/en/guides/assets/#update-content-collections-schemas for our new import instructions.'
	);
};

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

let lookupMap = {};
/* @@LOOKUP_MAP_ASSIGNMENT@@ */

function createGlobLookup(glob) {
	return async (collection, lookupId) => {
		const filePath = lookupMap[collection]?.[lookupId];

		if (!filePath) return undefined;
		return glob[collection][filePath];
	};
}

const renderEntryGlob = import.meta.glob('@@RENDER_ENTRY_GLOB_PATH@@', {
	query: { astroPropagatedAssets: true },
});
const collectionToRenderEntryMap = createCollectionToGlobResultMap({
	globResult: renderEntryGlob,
	contentDir,
});

export const getCollection = createGetCollection({
	contentCollectionToEntryMap,
	getRenderEntryImport: createGlobLookup(collectionToRenderEntryMap),
});

export const getDataCollection = createGetDataCollection({
	dataCollectionToEntryMap,
});

export const getEntryBySlug = createGetEntryBySlug({
	getEntryImport: createGlobLookup(collectionToEntryMap),
	getRenderEntryImport: createGlobLookup(collectionToRenderEntryMap),
});

export const getDataEntryById = createGetDataEntryById({
	dataCollectionToEntryMap,
});

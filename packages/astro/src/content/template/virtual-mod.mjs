// astro-head-inject
import {
	createCollectionToGlobResultMap,
	createGetCollection,
	createGetEntryBySlug,
	createGetDataEntryById,
	createReference,
} from 'astro/content/runtime';

export { z } from 'astro/zod';

const contentDir = '@@CONTENT_DIR@@';
const dataDir = '@@DATA_DIR@@';

const contentEntryGlob = import.meta.glob('@@CONTENT_ENTRY_GLOB_PATH@@', {
	query: { astroContentCollectionEntry: true },
});
const contentCollectionToEntryMap = createCollectionToGlobResultMap({
	globResult: contentEntryGlob,
	dir: contentDir,
});

const dataEntryGlob = import.meta.glob('@@DATA_ENTRY_GLOB_PATH@@', {
	query: { astroDataCollectionEntry: true },
});
const dataCollectionToEntryMap = createCollectionToGlobResultMap({
	globResult: dataEntryGlob,
	dir: dataDir,
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
	dir: contentDir,
});

let referenceKeyIncr = 0;

function baseDefineCollection({ type = 'content', ...partialConfig }) {
	// We don't know the collection name since this is defined on the `collections` export.
	// Generate a unique key for the collection that we can use for lookups.
	const referenceKey = String(referenceKeyIncr++);
	return {
		...partialConfig,
		type,
		reference: createReference({
			map: type === 'content' ? contentCollectionToEntryMap : dataCollectionToEntryMap,
			async getCollectionName() {
				const { default: map } = await import('@@COLLECTION_NAME_BY_REFERENCE_KEY@@');
				return map[referenceKey];
			},
		}),
		referenceKey,
	};
}

export function defineCollection(config) {
	return baseDefineCollection(config);
}

export function defineDataCollection(config) {
	return baseDefineCollection({ type: 'data', ...config });
}

// TODO: Remove this when having this fallback is no longer relevant. 2.3? 3.0? - erika, 2023-04-04
export const image = () => {
	throw new Error(
		'Importing `image()` from `astro:content` is no longer supported. See https://docs.astro.build/en/guides/assets/#update-content-collections-schemas for our new import instructions.'
	);
};

export const getCollection = createGetCollection({
	contentCollectionToEntryMap,
	getRenderEntryImport: createGlobLookup(collectionToRenderEntryMap),
});

export const getEntryBySlug = createGetEntryBySlug({
	getEntryImport: createGlobLookup(collectionToEntryMap),
	getRenderEntryImport: createGlobLookup(collectionToRenderEntryMap),
});

export const getDataEntryById = createGetDataEntryById({
	dataCollectionToEntryMap,
});

export const reference = createReference({
	dataCollectionToEntryMap,
});

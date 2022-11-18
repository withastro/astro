import {
	createGetCollection,
	createGetEntry,
	createRenderEntry,
	createCollectionToPaths,
	createCollectionToGlobResultMap,
} from 'astro/content/internal';

export { z } from 'astro/zod';

export function defineCollection(input) {
	return input;
}

const contentDir = '@@CONTENT_DIR@@';

const entryGlob = import.meta.glob('@@ENTRY_GLOB_PATH@@', {
	query: { astroContent: true },
});
const collectionToEntryMap = createCollectionToGlobResultMap({
	globResult: entryGlob,
	contentDir,
});

const schemaGlob = import.meta.glob('@@SCHEMA_GLOB_PATH@@');
const collectionToSchemaMap = createCollectionToGlobResultMap({
	globResult: schemaGlob,
	contentDir,
});

const renderEntryGlob = import.meta.glob('@@RENDER_ENTRY_GLOB_PATH@@', {
	query: { astroAssetSsr: true },
});
const collectionToRenderEntryMap = createCollectionToGlobResultMap({
	globResult: renderEntryGlob,
	contentDir,
});

export const getCollection = createGetCollection({
	collectionToEntryMap,
	collectionToSchemaMap,
});

export const getEntry = createGetEntry({
	collectionToEntryMap,
	collectionToSchemaMap,
	contentDir,
});

export const renderEntry = createRenderEntry({ collectionToRenderEntryMap });

export const collectionToPaths = createCollectionToPaths({
	getCollection,
});

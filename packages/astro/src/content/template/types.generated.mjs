import {
	createGetCollection,
	createGetEntry,
	createRenderEntry,
	createCollectionToPaths,
	createCollectionToGlobResultMap,
} from 'astro/content/internal';

export { z } from 'astro/zod';

export function defineCollection(config) {
	return config;
}

const contentDir = '@@CONTENT_DIR@@';

const entryGlob = import.meta.glob('@@ENTRY_GLOB_PATH@@', {
	query: { astroContent: true },
});
const collectionToEntryMap = createCollectionToGlobResultMap({
	globResult: entryGlob,
	contentDir,
});

async function getCollectionsConfig() {
	const res = await import('@@COLLECTIONS_IMPORT_PATH@@');
	if ('collections' in res) {
		return res.collections;
	}
	return {};
}

const renderEntryGlob = import.meta.glob('@@RENDER_ENTRY_GLOB_PATH@@', {
	query: { astroAssetSsr: true },
});
const collectionToRenderEntryMap = createCollectionToGlobResultMap({
	globResult: renderEntryGlob,
	contentDir,
});

export const getCollection = createGetCollection({
	collectionToEntryMap,
	getCollectionsConfig,
});

export const getEntry = createGetEntry({
	collectionToEntryMap,
	getCollectionsConfig,
	contentDir,
});

export const renderEntry = createRenderEntry({ collectionToRenderEntryMap });

export const collectionToPaths = createCollectionToPaths({
	getCollection,
});

// astro-head-inject
import {
	createCollectionToGlobResultMap,
	createGetCollection,
	createGetEntryBySlug,
} from 'astro/content/runtime';

export { z } from 'astro/zod';

export function defineCollection(config) {
	return config;
}

// TODO: Remove this when having this fallback is no longer relevant. 2.3? 3.0? - erika, 2023-04-04
export const image = () => {
	throw new Error(
		'Importing `image()` from `astro:content` is no longer supported. See https://docs.astro.build/en/guides/assets/#update-content-collections-schemas for our new import instructions.'
	);
};

const contentDir = '@@CONTENT_DIR@@';

const entryGlob = import.meta.glob('@@ENTRY_GLOB_PATH@@', {
	query: { astroContent: true },
});
const collectionToEntryMap = createCollectionToGlobResultMap({
	globResult: entryGlob,
	contentDir,
});

const renderEntryGlob = import.meta.glob('@@RENDER_ENTRY_GLOB_PATH@@', {
	query: { astroRenderContent: true },
});
const collectionToRenderEntryMap = createCollectionToGlobResultMap({
	globResult: renderEntryGlob,
	contentDir,
});

export const getCollection = createGetCollection({
	collectionToEntryMap,
	collectionToRenderEntryMap,
});

export const getEntryBySlug = createGetEntryBySlug({
	getCollection,
	collectionToRenderEntryMap,
});

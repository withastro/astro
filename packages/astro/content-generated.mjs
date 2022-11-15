import {
	createFetchContent,
	createFetchContentByEntry,
	createRenderEntry,
	createCollectionToGlobResultMap,
} from 'astro/content/internal';

const contentDir = 'CONTENT_DIR';

const contentGlob = import.meta.glob('FETCH_CONTENT_GLOB_PATH', {
	query: { astroContent: true },
});
const collectionToContentMap = createCollectionToGlobResultMap({
	globResult: contentGlob,
	contentDir,
});

const schemaGlob = import.meta.glob('SCHEMA_GLOB_PATH');
const collectionToSchemaMap = createCollectionToGlobResultMap({
	globResult: schemaGlob,
	contentDir,
});

const renderContentGlob = import.meta.glob('RENDER_CONTENT_GLOB_PATH', {
	query: { astroAssetSsr: true },
});
const collectionToRenderContentMap = createCollectionToGlobResultMap({
	globResult: renderContentGlob,
	contentDir,
});

export const fetchContent = createFetchContent({
	collectionToContentMap,
	collectionToSchemaMap,
});

export const fetchContentByEntry = createFetchContentByEntry({
	collectionToContentMap,
	collectionToSchemaMap,
	contentDir,
});

export const renderContent = createRenderEntry({ collectionToRenderContentMap });

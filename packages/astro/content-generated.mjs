import {
	createFetchContent,
	createFetchContentByEntry,
	createRenderContent,
	createCollectionToGlobResultMap,
} from 'astro/content/internal';

const contentDir = 'CONTENT_DIR';

const contentGlob = import.meta.glob('FETCH_CONTENT_GLOB_PATH', {
	query: { content: true },
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

const renderContentMap = import.meta.glob('RENDER_CONTENT_GLOB_PATH', {
	query: { astroAssetSsr: true },
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

export const renderContent = createRenderContent(renderContentMap);

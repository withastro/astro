// astro-head-inject
import {
	createGetCollection,
	createGetEntries,
	createGetEntry,
	createGetLiveCollection,
	createGetLiveEntry,
	createReference,
	createDeprecatedFunction,
} from 'astro/content/runtime';

export {
	defineCollection,
	defineLiveCollection,
	renderEntry as render,
} from 'astro/content/runtime';
export { z } from 'astro/zod';

/* @@LIVE_CONTENT_CONFIG@@ */

export const getCollection = createGetCollection({
	liveCollections,
});

export const getEntry = createGetEntry({
	liveCollections,
});

export const getEntries = createGetEntries(getEntry);

export const reference = createReference();

export const getLiveCollection = createGetLiveCollection({
	liveCollections,
});

export const getLiveEntry = createGetLiveEntry({
	liveCollections,
});

export const getEntryBySlug = createDeprecatedFunction(
	'getEntryBySlug',
);

export const getDataEntryById = createDeprecatedFunction(
	'getDataEntryById',
);

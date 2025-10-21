// astro-head-inject
import {
	createDeprecatedFunction,
	createGetCollection,
	createGetEntries,
	createGetEntry,
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

import { experimentalZod4 } from 'virtual:astro:config/experimentalZod4';

/* @@LIVE_CONTENT_CONFIG@@ */

export const getCollection = createGetCollection({
	liveCollections,
});

export const getEntry = createGetEntry({
	liveCollections,
});

export const getEntries = createGetEntries(getEntry);

export const reference = createReference(experimentalZod4);

export const getLiveCollection = createGetLiveCollection({
	liveCollections,
});

export const getLiveEntry = createGetLiveEntry({
	liveCollections,
});

// TODO: remove in Astro 7
export const getEntryBySlug = createDeprecatedFunction('getEntryBySlug');

// TODO: remove in Astro 7
export const getDataEntryById = createDeprecatedFunction('getDataEntryById');

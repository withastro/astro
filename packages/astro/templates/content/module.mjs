import { createConsoleLogger } from 'astro/logger/console';
import loggerDestination, { level } from 'virtual:astro:logger';
import {
	createDeprecatedFunction,
	createGetCollection,
	createGetEntries,
	createGetEntry,
	createGetLiveCollection,
	createGetLiveEntry,
	createReference,
	createRenderEntry,
} from 'astro/content/runtime';

export { defineCollection } from 'astro/content/runtime';
/* @@DEFINE_LIVE_COLLECTION@@ */
// TODO: remove in Astro 8
export { z } from 'astro/zod';

/* @@LIVE_CONTENT_CONFIG@@ */
/* @@LIVE_CONTENT_ENTRYPOINTS@@ */

const logger = createConsoleLogger({ level });
if (loggerDestination) {
	logger.setDestination(loggerDestination);
}

export const getCollection = createGetCollection({
	liveCollections,
	liveCollectionEntrypoints,
	logger,
});

export const getEntry = createGetEntry({
	liveCollections,
	liveCollectionEntrypoints,
	logger,
});

export const render = createRenderEntry({ logger });

export const getEntries = createGetEntries(getEntry);

export const reference = createReference();

export const getLiveCollection = createGetLiveCollection({
	liveCollections,
	liveCollectionEntrypoints,
});

export const getLiveEntry = createGetLiveEntry({
	liveCollections,
	liveCollectionEntrypoints,
});

// TODO: remove in Astro 8
export const getEntryBySlug = createDeprecatedFunction('getEntryBySlug');

// TODO: remove in Astro 8
export const getDataEntryById = createDeprecatedFunction('getDataEntryById');

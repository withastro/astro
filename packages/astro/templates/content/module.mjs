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

export { defineCollection, defineLiveCollection } from 'astro/content/runtime';
// TODO: remove in Astro 8
export { z } from 'astro/zod';

/* @@LIVE_CONTENT_CONFIG@@ */

const logger = createConsoleLogger({ level });
if (loggerDestination) {
	logger.setDestination(loggerDestination);
}

export const getCollection = createGetCollection({
	liveCollections,
	logger,
});

export const getEntry = createGetEntry({
	liveCollections,
	logger,
});

// `renderEntry` dynamically imports every renderable entry. Marked pure so the bundler can
// drop it from server bundles whose routes never call `render()`; otherwise each entry
// that only prerendered pages render is compiled into the server output.
export const render = /* @__PURE__ */ createRenderEntry({ logger });

export const getEntries = createGetEntries(getEntry);

export const reference = createReference();

export const getLiveCollection = createGetLiveCollection({
	liveCollections,
});

export const getLiveEntry = createGetLiveEntry({
	liveCollections,
});

// TODO: remove in Astro 8
export const getEntryBySlug = createDeprecatedFunction('getEntryBySlug');

// TODO: remove in Astro 8
export const getDataEntryById = createDeprecatedFunction('getDataEntryById');

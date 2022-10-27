import { getErrorMsg, parseEntryData, createRenderContent } from 'astro/content/internal';

const defaultSchemaFileResolved = { schema: { parse: (mod) => mod } };
/** Used to stub out `schemaMap` entries that don't have a `~schema.ts` file */
const defaultSchemaFile = (/** @type {string} */ collection) =>
	new Promise((/** @type {(value: typeof defaultSchemaFileResolved) => void} */ resolve) => {
		console.warn(getErrorMsg.schemaMissing(collection));
		resolve(defaultSchemaFileResolved);
	});

export const contentMap = {
	// GENERATED_CONTENT_MAP_ENTRIES
};

export const schemaMap = {
	// GENERATED_SCHEMA_MAP_ENTRIES
};

export const renderContentMap = {
	// GENERATED_RENDER_CONTENT_MAP_ENTRIES
};

export async function fetchContentByEntry(
	/** @type {string} */ collection,
	/** @type {string} */ entryKey
) {
	const entry = contentMap[collection][entryKey];

	return {
		id: entry.id,
		slug: entry.slug,
		body: entry.body,
		data: await parseEntryData(collection, entryKey, entry, { schemaMap }),
	};
}

export async function fetchContent(
	/** @type {string} */ collection,
	/** @type {undefined | (() => boolean)} */ filter
) {
	const entries = Promise.all(
		Object.entries(contentMap[collection]).map(async ([key, entry]) => {
			return {
				id: entry.id,
				slug: entry.slug,
				body: entry.body,
				data: await parseEntryData(collection, key, entry, { schemaMap }),
			};
		})
	);
	if (typeof filter === 'function') {
		return (await entries).filter(filter);
	} else {
		return entries;
	}
}

export const renderContent = createRenderContent(renderContentMap);

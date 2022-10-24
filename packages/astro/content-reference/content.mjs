import { z } from 'zod';
import { getFrontmatterErrorLine, errorMap } from 'astro/content-internals';

const NO_SCHEMA_MSG = (/** @type {string} */ collection) =>
	`${collection} does not have a ~schema file. We suggest adding one for type safety!`;

const defaultSchemaFileResolved = { schema: { parse: (mod) => mod } };
/** Used to stub out `schemaMap` entries that don't have a `~schema.ts` file */
const defaultSchemaFile = (/** @type {string} */ collection) =>
	new Promise((/** @type {(value: typeof defaultSchemaFileResolved) => void} */ resolve) => {
		console.warn(NO_SCHEMA_MSG(collection));
		resolve(defaultSchemaFileResolved);
	});

const getSchemaError = (collection) =>
	new Error(`${collection}/~schema needs a named \`schema\` export.`);

async function parseEntryData(
	/** @type {string} */ collection,
	/** @type {string} */ entryKey,
	/** @type {{ data: any; rawData: string; }} */ unparsedEntry,
	/** @type {{ schemaMap: any }} */ { schemaMap }
) {
	const defineSchemaResult = await schemaMap[collection];
	if (!defineSchemaResult) throw getSchemaError(collection);
	const { schema } = defineSchemaResult;

	try {
		return schema.parse(unparsedEntry.data, { errorMap });
	} catch (e) {
		if (e instanceof z.ZodError) {
			const formattedError = new Error(
				[
					`Could not parse frontmatter in ${String(collection)} → ${String(entryKey)}`,
					...e.errors.map((e) => e.message),
				].join('\n')
			);
			formattedError.loc = {
				file: 'TODO',
				line: getFrontmatterErrorLine(unparsedEntry.rawData, String(e.errors[0].path[0])),
				column: 1,
			};
			throw formattedError;
		}
	}
}

export const contentMap = {
	// GENERATED_CONTENT_MAP_ENTRIES
};

export const schemaMap = {
	// GENERATED_SCHEMA_MAP_ENTRIES
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

import { z } from 'zod';
import { prependForwardSlash } from '../core/path.js';

type GlobResult = Record<string, () => Promise<any>>;
type CollectionToEntryMap = Record<string, GlobResult>;

export function createCollectionToGlobResultMap({
	globResult,
	contentDir,
}: {
	globResult: GlobResult;
	contentDir: string;
}) {
	const collectionToGlobResultMap: CollectionToEntryMap = {};
	for (const key in globResult) {
		const keyRelativeToContentDir = key.replace(new RegExp(`^${contentDir}`), '');
		const segments = keyRelativeToContentDir.split('/');
		if (segments.length <= 1) continue;
		const collection = segments[0];
		const entryId = segments.slice(1).join('/');
		collectionToGlobResultMap[collection] ??= {};
		collectionToGlobResultMap[collection][entryId] = globResult[key];
	}
	return collectionToGlobResultMap;
}

export async function parseEntryData(
	collection: string,
	unparsedEntry: { id: string; data: any; rawData: string },
	collectionToSchemaMap: CollectionToEntryMap
) {
	let schemaImport = Object.values(collectionToSchemaMap[collection] ?? {})[0];
	if (!schemaImport) {
		console.warn(getErrorMsg.schemaFileMissing(collection));
	}
	const schemaValue = await schemaImport();
	if (!('schema' in (schemaValue ?? {}))) {
		throw new Error(getErrorMsg.schemaNamedExpMissing(collection));
	}
	const { schema } = schemaValue;

	try {
		return schema.parse(unparsedEntry.data, { errorMap });
	} catch (e) {
		if (e instanceof z.ZodError) {
			const formattedError = new Error(
				[
					`Could not parse frontmatter in ${String(collection)} → ${String(unparsedEntry.id)}`,
					...e.errors.map((e) => e.message),
				].join('\n')
			);
			(formattedError as any).loc = {
				file: 'TODO',
				line: getFrontmatterErrorLine(unparsedEntry.rawData, String(e.errors[0].path[0])),
				column: 1,
			};
			throw formattedError;
		}
	}
}

const flattenPath = (path: (string | number)[]) => path.join('.');

const errorMap: z.ZodErrorMap = (error, ctx) => {
	if (error.code === 'invalid_type') {
		const badKeyPath = JSON.stringify(flattenPath(error.path));
		if (error.received === 'undefined') {
			return { message: `${badKeyPath} is required.` };
		} else {
			return { message: `${badKeyPath} should be ${error.expected}, not ${error.received}.` };
		}
	}
	return { message: ctx.defaultError };
};

// WARNING: MAXIMUM JANK AHEAD
function getFrontmatterErrorLine(rawFrontmatter: string, frontmatterKey: string) {
	const indexOfFrontmatterKey = rawFrontmatter.indexOf(`\n${frontmatterKey}`);
	if (indexOfFrontmatterKey === -1) return 0;

	const frontmatterBeforeKey = rawFrontmatter.substring(0, indexOfFrontmatterKey + 1);
	const numNewlinesBeforeKey = frontmatterBeforeKey.split('\n').length;
	return numNewlinesBeforeKey;
}

export const getErrorMsg = {
	schemaFileMissing: (collection: string) =>
		`${collection} does not have a ~schema file. We suggest adding one for type safety!`,
	schemaNamedExpMissing: (collection: string) =>
		`${collection}/~schema needs a named \`schema\` export.`,
};

export function createFetchContent({
	collectionToContentMap,
	collectionToSchemaMap,
}: {
	collectionToContentMap: CollectionToEntryMap;
	collectionToSchemaMap: CollectionToEntryMap;
}) {
	return async function fetchContent(collection: string, filter?: () => boolean) {
		const lazyImports = Object.values(collectionToContentMap[collection] ?? {});
		const entries = Promise.all(
			lazyImports.map(async (lazyImport) => {
				const entry = await lazyImport();
				const data = await parseEntryData(collection, entry, collectionToSchemaMap);
				return {
					id: entry.id,
					slug: entry.slug,
					body: entry.body,
					data,
				};
			})
		);
		if (typeof filter === 'function') {
			return (await entries).filter(filter);
		} else {
			return entries;
		}
	};
}

export function createFetchContentByEntry({
	collectionToContentMap,
	collectionToSchemaMap,
}: {
	collectionToSchemaMap: CollectionToEntryMap;
	collectionToContentMap: CollectionToEntryMap;
}) {
	return async function fetchContentByEntry(collection: string, entryId: string) {
		const lazyImport = collectionToContentMap[collection]?.[entryId];
		if (!lazyImport) throw new Error(`Ah! ${entryId}`);

		const entry = await lazyImport();
		const data = await parseEntryData(collection, entry, collectionToSchemaMap);
		return {
			id: entry.id,
			slug: entry.slug,
			body: entry.body,
			data,
		};
	};
}

export function createRenderContent(renderContentMap: Record<string, () => Promise<any>>) {
	return async function renderContent(this: any, entryOrEntryId: { id: string } | string) {
		const contentKey = typeof entryOrEntryId === 'object' ? entryOrEntryId.id : entryOrEntryId;
		const modImport = renderContentMap[contentKey];
		if (!modImport) throw new Error(`${JSON.stringify(contentKey)} does not exist!`);

		const mod = await modImport();

		if ('collectedLinks' in mod && 'links' in (this ?? {})) {
			for (const link of mod.collectedLinks) {
				this.links.add({
					props: { rel: 'stylesheet', href: prependForwardSlash(link) },
					children: '',
				});
			}
		}
		if ('collectedStyles' in mod && 'styles' in (this ?? {})) {
			for (const style of mod.collectedStyles) {
				this.styles.add({
					props: {},
					children: style,
				});
			}
		}
		return mod;
	};
}

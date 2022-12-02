import { z } from 'zod';
import { prependForwardSlash } from '../core/path.js';

type GlobResult = Record<string, () => Promise<any>>;
type CollectionToEntryMap = Record<string, GlobResult>;
type CollectionsConfig = Record<string, { schema: z.ZodRawShape }>;

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
	entry: { id: string; data: any; _internal: { rawData: string; filePath: string } },
	collectionsConfig: CollectionsConfig
) {
	if (!('schema' in (collectionsConfig[collection] ?? {}))) {
		throw new Error(getErrorMsg.schemaDefMissing(collection));
	}
	const { schema } = collectionsConfig[collection];
	// Use `safeParseAsync` to allow async transforms
	const parsed = await z.object(schema).safeParseAsync(entry.data, { errorMap });

	if (parsed.success) {
		return parsed.data;
	} else {
		const formattedError = new Error(
			[
				`Could not parse frontmatter in ${String(collection)} → ${String(entry.id)}`,
				...parsed.error.errors.map((zodError) => zodError.message),
			].join('\n')
		);
		(formattedError as any).loc = {
			file: entry._internal.filePath,
			line: getFrontmatterErrorLine(
				entry._internal.rawData,
				String(parsed.error.errors[0].path[0])
			),
			column: 1,
		};
		throw formattedError;
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
		`${collection} does not have a config. We suggest adding one for type safety!`,
	schemaDefMissing: (collection: string) =>
		`${collection} needs a schema definition. Check your src/content/config!`,
};

export function createGetCollection({
	collectionToEntryMap,
	getCollectionsConfig,
}: {
	collectionToEntryMap: CollectionToEntryMap;
	getCollectionsConfig: () => Promise<CollectionsConfig>;
}) {
	return async function getCollection(collection: string, filter?: () => boolean) {
		const lazyImports = Object.values(collectionToEntryMap[collection] ?? {});
		const collectionsConfig = await getCollectionsConfig();
		const entries = Promise.all(
			lazyImports.map(async (lazyImport) => {
				const entry = await lazyImport();
				const data = await parseEntryData(collection, entry, collectionsConfig);
				return {
					id: entry.id,
					slug: entry.slug,
					body: entry.body,
					collection: entry.collection,
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

export function createGetEntry({
	collectionToEntryMap,
	getCollectionsConfig,
}: {
	collectionToEntryMap: CollectionToEntryMap;
	getCollectionsConfig: () => Promise<CollectionsConfig>;
}) {
	return async function getEntry(collection: string, entryId: string) {
		const lazyImport = collectionToEntryMap[collection]?.[entryId];
		const collectionsConfig = await getCollectionsConfig();
		if (!lazyImport) throw new Error(`Ah! ${entryId}`);

		const entry = await lazyImport();
		const data = await parseEntryData(collection, entry, collectionsConfig);
		return {
			id: entry.id,
			slug: entry.slug,
			body: entry.body,
			collection: entry.collection,
			data,
		};
	};
}

export function createCollectionToPaths({
	getCollection,
}: {
	getCollection: ReturnType<typeof createGetCollection>;
}) {
	return async function collectionToPaths(collection: string) {
		const entries = await getCollection(collection);
		return entries.map((entry) => ({
			params: { slug: entry.slug },
			props: entry,
		}));
	};
}

export function createRenderEntry({
	collectionToRenderEntryMap,
}: {
	collectionToRenderEntryMap: CollectionToEntryMap;
}) {
	return async function renderEntry(this: any, entry: { collection: string; id: string }) {
		const lazyImport = collectionToRenderEntryMap[entry.collection]?.[entry.id];
		if (!lazyImport)
			throw new Error(`${String(entry.collection)} → ${String(entry.id)} does not exist.`);

		const mod = await lazyImport();

		if (Array.isArray(mod?.collectedLinks) && 'links' in (this ?? {})) {
			for (const link of mod.collectedLinks) {
				this.links.add({
					props: { rel: 'stylesheet', href: prependForwardSlash(link) },
					children: '',
				});
			}
		}
		if (Array.isArray(mod?.collectedStyles) && 'styles' in (this ?? {})) {
			for (const style of mod.collectedStyles) {
				this.styles.add({
					props: {},
					children: style,
				});
			}
		}
		return {
			Content: mod.Content,
			headings: mod.getHeadings(),
			injectedFrontmatter: mod._internal.injectedFrontmatter,
		};
	};
}

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

export function createGetCollection({
	collectionToEntryMap,
}: {
	collectionToEntryMap: CollectionToEntryMap;
}) {
	return async function getCollection(collection: string, filter?: () => boolean) {
		const lazyImports = Object.values(collectionToEntryMap[collection] ?? {});
		const entries = Promise.all(
			lazyImports.map(async (lazyImport) => {
				const entry = await lazyImport();
				return {
					id: entry.id,
					slug: entry.slug,
					body: entry.body,
					collection: entry.collection,
					data: entry.data,
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
}: {
	collectionToEntryMap: CollectionToEntryMap;
}) {
	return async function getEntry(collection: string, entryId: string) {
		const lazyImport = collectionToEntryMap[collection]?.[entryId];
		if (!lazyImport) throw new Error(`Ah! ${entryId}`);

		const entry = await lazyImport();
		return {
			id: entry.id,
			slug: entry.slug,
			body: entry.body,
			collection: entry.collection,
			data: entry.data,
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

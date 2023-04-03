import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { prependForwardSlash } from '../core/path.js';

import {
	createComponent,
	createHeadAndContent,
	renderComponent,
	renderScriptElement,
	renderStyleElement,
	renderTemplate,
	renderUniqueStylesheet,
	unescapeHTML,
} from '../runtime/server/index.js';

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

const cacheEntriesByCollection = new Map<string, any[]>();
export function createGetCollection({
	collectionToEntryMap,
	collectionToRenderEntryMap,
}: {
	collectionToEntryMap: CollectionToEntryMap;
	collectionToRenderEntryMap: CollectionToEntryMap;
}) {
	return async function getCollection(collection: string, filter?: (entry: any) => unknown) {
		const lazyImports = Object.values(collectionToEntryMap[collection] ?? {});
		let entries: any[] = [];
		// Cache `getCollection()` calls in production only
		// prevents stale cache in development
		if (import.meta.env.PROD && cacheEntriesByCollection.has(collection)) {
			entries = cacheEntriesByCollection.get(collection)!;
		} else {
			entries = await Promise.all(
				lazyImports.map(async (lazyImport) => {
					const entry = await lazyImport();
					return {
						id: entry.id,
						slug: entry.slug,
						body: entry.body,
						collection: entry.collection,
						data: entry.data,
						async render() {
							return render({
								collection: entry.collection,
								id: entry.id,
								collectionToRenderEntryMap,
							});
						},
					};
				})
			);
			cacheEntriesByCollection.set(collection, entries);
		}
		if (typeof filter === 'function') {
			return entries.filter(filter);
		} else {
			return entries;
		}
	};
}

export function createGetEntryBySlug({
	getCollection,
	collectionToRenderEntryMap,
}: {
	getCollection: ReturnType<typeof createGetCollection>;
	collectionToRenderEntryMap: CollectionToEntryMap;
}) {
	return async function getEntryBySlug(collection: string, slug: string) {
		// This is not an optimized lookup. Should look into an O(1) implementation
		// as it's probably that people will have very large collections.
		const entries = await getCollection(collection);
		let candidate: (typeof entries)[number] | undefined = undefined;
		for (let entry of entries) {
			if (entry.slug === slug) {
				candidate = entry;
				break;
			}
		}

		if (typeof candidate === 'undefined') {
			return undefined;
		}

		const entry = candidate;
		return {
			id: entry.id,
			slug: entry.slug,
			body: entry.body,
			collection: entry.collection,
			data: entry.data,
			async render() {
				return render({
					collection: entry.collection,
					id: entry.id,
					collectionToRenderEntryMap,
				});
			},
		};
	};
}

async function render({
	collection,
	id,
	collectionToRenderEntryMap,
}: {
	collection: string;
	id: string;
	collectionToRenderEntryMap: CollectionToEntryMap;
}) {
	const UnexpectedRenderError = new AstroError({
		...AstroErrorData.UnknownContentCollectionError,
		message: `Unexpected error while rendering ${String(collection)} → ${String(id)}.`,
	});

	const lazyImport = collectionToRenderEntryMap[collection]?.[id];
	if (typeof lazyImport !== 'function') throw UnexpectedRenderError;

	const baseMod = await lazyImport();
	if (baseMod == null || typeof baseMod !== 'object') throw UnexpectedRenderError;

	const { collectedStyles, collectedLinks, collectedScripts, getMod } = baseMod;
	if (typeof getMod !== 'function') throw UnexpectedRenderError;
	const mod = await getMod();
	if (mod == null || typeof mod !== 'object') throw UnexpectedRenderError;

	const Content = createComponent({
		factory(result, baseProps, slots) {
			let styles = '',
				links = '',
				scripts = '';
			if (Array.isArray(collectedStyles)) {
				styles = collectedStyles.map((style: any) => renderStyleElement(style)).join('');
			}
			if (Array.isArray(collectedLinks)) {
				links = collectedLinks
					.map((link: any) => {
						return renderUniqueStylesheet(result, {
							href: prependForwardSlash(link),
						});
					})
					.join('');
			}
			if (Array.isArray(collectedScripts)) {
				scripts = collectedScripts.map((script: any) => renderScriptElement(script)).join('');
			}

			let props = baseProps;
			// Auto-apply MDX components export
			if (id.endsWith('mdx')) {
				props = {
					components: mod.components ?? {},
					...baseProps,
				};
			}

			console.log(renderTemplate`${renderComponent(result, 'Content', mod.Content, props, slots)}`);

			return createHeadAndContent(
				unescapeHTML(styles + links + scripts) as any,
				renderTemplate`${renderComponent(result, 'Content', mod.Content, props, slots)}`
			);
		},
		propagation: 'self',
	});

	return {
		Content: mod.Content,
		headings: mod.getHeadings?.() ?? [],
		remarkPluginFrontmatter: mod.frontmatter ?? {},
	};
}

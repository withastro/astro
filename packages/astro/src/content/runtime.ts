import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { prependForwardSlash } from '../core/path.js';

import {
	createComponent,
	createHeadAndContent,
	renderComponent,
	renderScriptElement,
	renderTemplate,
	renderUniqueStylesheet,
	unescapeHTML,
} from '../runtime/server/index.js';

type LazyImport = () => Promise<any>;
type GlobResult = Record<string, LazyImport>;
type CollectionToEntryMap = Record<string, GlobResult>;
type GetEntryImport = (collection: string, lookupId: string) => Promise<LazyImport>;

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
		collectionToGlobResultMap[collection] ??= {};
		collectionToGlobResultMap[collection][key] = globResult[key];
	}
	return collectionToGlobResultMap;
}

const cacheEntriesByCollection = new Map<string, any[]>();
export function createGetCollection({
	collectionToEntryMap,
	getRenderEntryImport,
}: {
	collectionToEntryMap: CollectionToEntryMap;
	getRenderEntryImport: GetEntryImport;
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
								renderEntryImport: await getRenderEntryImport(collection, entry.slug),
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
	getEntryImport,
	getRenderEntryImport,
}: {
	getEntryImport: GetEntryImport;
	getRenderEntryImport: GetEntryImport;
}) {
	return async function getEntryBySlug(collection: string, slug: string) {
		const entryImport = await getEntryImport(collection, slug);
		if (typeof entryImport !== 'function') return undefined;

		const entry = await entryImport();

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
					renderEntryImport: await getRenderEntryImport(collection, slug),
				});
			},
		};
	};
}

async function render({
	collection,
	id,
	renderEntryImport,
}: {
	collection: string;
	id: string;
	renderEntryImport?: LazyImport;
}) {
	const UnexpectedRenderError = new AstroError({
		...AstroErrorData.UnknownContentCollectionError,
		message: `Unexpected error while rendering ${String(collection)} → ${String(id)}.`,
	});

	if (typeof renderEntryImport !== 'function') throw UnexpectedRenderError;

	const baseMod = await renderEntryImport();
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
				styles = collectedStyles
					.map((style: any) => {
						return renderUniqueStylesheet(result, {
							type: 'inline',
							content: style,
						});
					})
					.join('');
			}
			if (Array.isArray(collectedLinks)) {
				links = collectedLinks
					.map((link: any) => {
						return renderUniqueStylesheet(result, {
							type: 'external',
							src: prependForwardSlash(link),
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

			return createHeadAndContent(
				unescapeHTML(styles + links + scripts) as any,
				renderTemplate`${renderComponent(result, 'Content', mod.Content, props, slots)}`
			);
		},
		propagation: 'self',
	});

	return {
		Content,
		headings: mod.getHeadings?.() ?? [],
		remarkPluginFrontmatter: mod.frontmatter ?? {},
	};
}

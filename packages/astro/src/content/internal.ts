import { prependForwardSlash } from '../core/path.js';

import {
	createComponent,
	createHeadAndContent,
	renderComponent,
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

export function createGetCollection({
	collectionToEntryMap,
	collectionToRenderEntryMap,
}: {
	collectionToEntryMap: CollectionToEntryMap;
	collectionToRenderEntryMap: CollectionToEntryMap;
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
		if (typeof filter === 'function') {
			return (await entries).filter(filter);
		} else {
			return entries;
		}
	};
}

export function createGetEntry({
	collectionToEntryMap,
	collectionToRenderEntryMap,
}: {
	collectionToEntryMap: CollectionToEntryMap;
	collectionToRenderEntryMap: CollectionToEntryMap;
}) {
	return async function getEntry(collection: string, entryId: string) {
		const lazyImport = collectionToEntryMap[collection]?.[entryId];
		if (!lazyImport) throw new Error(`Failed to import ${JSON.stringify(entryId)}.`);

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
	const lazyImport = collectionToRenderEntryMap[collection]?.[id];
	if (!lazyImport) throw new Error(`${String(collection)} → ${String(id)} does not exist.`);

	const mod = await lazyImport();

	const Content = createComponent({
		factory(result, props, slots) {
			let styles = '',
				links = '';
			if (Array.isArray(mod?.collectedStyles)) {
				styles = mod.collectedStyles.map((style: any) => renderStyleElement(style)).join('');
			}
			if (Array.isArray(mod?.collectedLinks)) {
				links = mod.collectedLinks
					.map((link: any) => {
						return renderUniqueStylesheet(result, {
							href: prependForwardSlash(link),
						});
					})
					.join('');
			}

			return createHeadAndContent(
				unescapeHTML(styles + links) as any,
				renderTemplate`${renderComponent(result, 'Content', mod.Content, props, slots)}`
			);
		},
		propagation: 'self',
	});

	return {
		Content,
		headings: mod.getHeadings(),
		remarkPluginFrontmatter: mod.frontmatter,
	};
}

import type { MarkdownHeading } from '@astrojs/markdown-remark';
import { ZodIssueCode, string as zodString } from 'zod';
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
	type AstroComponentFactory,
} from '../runtime/server/index.js';
import type { ContentLookupMap } from './utils.js';

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
	contentCollectionToEntryMap,
	dataCollectionToEntryMap,
	getRenderEntryImport,
}: {
	contentCollectionToEntryMap: CollectionToEntryMap;
	dataCollectionToEntryMap: CollectionToEntryMap;
	getRenderEntryImport: GetEntryImport;
}) {
	return async function getCollection(collection: string, filter?: (entry: any) => unknown) {
		let type: 'content' | 'data';
		if (collection in contentCollectionToEntryMap) {
			type = 'content';
		} else if (collection in dataCollectionToEntryMap) {
			type = 'data';
		} else {
			// eslint-disable-next-line no-console
			console.warn(
				`The collection **${collection}** does not exist or is empty. Ensure a collection directory with this name exists.`
			);
			return;
		}
		const lazyImports = Object.values(
			type === 'content'
				? contentCollectionToEntryMap[collection]
				: dataCollectionToEntryMap[collection]
		);
		let entries: any[] = [];
		// Cache `getCollection()` calls in production only
		// prevents stale cache in development
		if (!import.meta.env?.DEV && cacheEntriesByCollection.has(collection)) {
			// Always return a new instance so consumers can safely mutate it
			entries = [...cacheEntriesByCollection.get(collection)!];
		} else {
			entries = await Promise.all(
				lazyImports.map(async (lazyImport) => {
					const entry = await lazyImport();
					return type === 'content'
						? {
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
						  }
						: {
								id: entry.id,
								collection: entry.collection,
								data: entry.data,
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

export function createGetDataEntryById({ getEntryImport }: { getEntryImport: GetEntryImport }) {
	return async function getDataEntryById(collection: string, id: string) {
		const lazyImport = await getEntryImport(collection, id);

		// TODO: AstroError
		if (!lazyImport) throw new Error(`Entry ${collection} → ${id} was not found.`);
		const entry = await lazyImport();

		return {
			id: entry.id,
			collection: entry.collection,
			data: entry.data,
		};
	};
}

type ContentEntryResult = {
	id: string;
	slug: string;
	body: string;
	collection: string;
	data: Record<string, any>;
	render(): Promise<RenderResult>;
};

type DataEntryResult = {
	id: string;
	collection: string;
	data: Record<string, any>;
};

type EntryLookupObject = { collection: string; id: string } | { collection: string; slug: string };

export function createGetEntry({
	getEntryImport,
	getRenderEntryImport,
}: {
	getEntryImport: GetEntryImport;
	getRenderEntryImport: GetEntryImport;
}) {
	return async function getEntry(
		// Can either pass collection and identifier as 2 positional args,
		// Or pass a single object with the collection and identifier as properties.
		// This means the first positional arg can have different shapes.
		collectionOrLookupObject: string | EntryLookupObject,
		_lookupId?: string
	): Promise<ContentEntryResult | DataEntryResult | undefined> {
		let collection: string, lookupId: string;
		if (typeof collectionOrLookupObject === 'string') {
			collection = collectionOrLookupObject;
			if (!_lookupId)
				throw new AstroError({
					...AstroErrorData.UnknownContentCollectionError,
					message: '`getEntry()` requires an entry identifier as the second argument.',
				});
			lookupId = _lookupId;
		} else {
			collection = collectionOrLookupObject.collection;
			// Identifier could be `slug` for content entries, or `id` for data entries
			lookupId =
				'id' in collectionOrLookupObject
					? collectionOrLookupObject.id
					: collectionOrLookupObject.slug;
		}

		const entryImport = await getEntryImport(collection, lookupId);
		if (typeof entryImport !== 'function') return undefined;

		const entry = await entryImport();

		if (entry._internal.type === 'content') {
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
						renderEntryImport: await getRenderEntryImport(collection, lookupId),
					});
				},
			};
		} else if (entry._internal.type === 'data') {
			return {
				id: entry.id,
				collection: entry.collection,
				data: entry.data,
			};
		}
		return undefined;
	};
}

export function createGetEntries(getEntry: ReturnType<typeof createGetEntry>) {
	return async function getEntries(
		entries: { collection: string; id: string }[] | { collection: string; slug: string }[]
	) {
		return Promise.all(entries.map((e) => getEntry(e)));
	};
}

type RenderResult = {
	Content: AstroComponentFactory;
	headings: MarkdownHeading[];
	remarkPluginFrontmatter: Record<string, any>;
};

async function render({
	collection,
	id,
	renderEntryImport,
}: {
	collection: string;
	id: string;
	renderEntryImport?: LazyImport;
}): Promise<RenderResult> {
	const UnexpectedRenderError = new AstroError({
		...AstroErrorData.UnknownContentCollectionError,
		message: `Unexpected error while rendering ${String(collection)} → ${String(id)}.`,
	});

	if (typeof renderEntryImport !== 'function') throw UnexpectedRenderError;

	const baseMod = await renderEntryImport();
	if (baseMod == null || typeof baseMod !== 'object') throw UnexpectedRenderError;
	const { default: defaultMod } = baseMod;

	if (isPropagatedAssetsModule(defaultMod)) {
		const { collectedStyles, collectedLinks, collectedScripts, getMod } = defaultMod;
		if (typeof getMod !== 'function') throw UnexpectedRenderError;
		const propagationMod = await getMod();
		if (propagationMod == null || typeof propagationMod !== 'object') throw UnexpectedRenderError;

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
						components: propagationMod.components ?? {},
						...baseProps,
					};
				}

				return createHeadAndContent(
					unescapeHTML(styles + links + scripts) as any,
					renderTemplate`${renderComponent(
						result,
						'Content',
						propagationMod.Content,
						props,
						slots
					)}`
				);
			},
			propagation: 'self',
		});

		return {
			Content,
			headings: propagationMod.getHeadings?.() ?? [],
			remarkPluginFrontmatter: propagationMod.frontmatter ?? {},
		};
	} else if (baseMod.Content && typeof baseMod.Content === 'function') {
		return {
			Content: baseMod.Content,
			headings: baseMod.getHeadings?.() ?? [],
			remarkPluginFrontmatter: baseMod.frontmatter ?? {},
		};
	} else {
		throw UnexpectedRenderError;
	}
}

export function createReference({ lookupMap }: { lookupMap: ContentLookupMap }) {
	return function reference(collection: string) {
		return zodString().transform((lookupId: string, ctx) => {
			const flattenedErrorPath = ctx.path.join('.');
			if (!lookupMap[collection]) {
				ctx.addIssue({
					code: ZodIssueCode.custom,
					message: `**${flattenedErrorPath}:** Reference to ${collection} invalid. Collection does not exist or is empty.`,
				});
				return;
			}

			const { type, entries } = lookupMap[collection];
			const entry = entries[lookupId];

			if (!entry) {
				ctx.addIssue({
					code: ZodIssueCode.custom,
					message: `**${flattenedErrorPath}**: Reference to ${collection} invalid. Expected ${Object.keys(
						entries
					)
						.map((c) => JSON.stringify(c))
						.join(' | ')}. Received ${JSON.stringify(lookupId)}.`,
				});
				return;
			}
			// Content is still identified by slugs, so map to a `slug` key for consistency.
			if (type === 'content') {
				return { slug: lookupId, collection };
			}
			return { id: lookupId, collection };
		});
	};
}

type PropagatedAssetsModule = {
	__astroPropagation: true;
	getMod: () => Promise<any>;
	collectedStyles: string[];
	collectedLinks: string[];
	collectedScripts: string[];
};

function isPropagatedAssetsModule(module: any): module is PropagatedAssetsModule {
	return typeof module === 'object' && module != null && '__astroPropagation' in module;
}

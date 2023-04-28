import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { prependForwardSlash } from '../core/path.js';
import { ZodIssueCode, string as zodString, type z } from 'zod';
import {
	createComponent,
	createHeadAndContent,
	renderComponent,
	renderScriptElement,
	renderTemplate,
	renderUniqueStylesheet,
	unescapeHTML,
} from '../runtime/server/index.js';
import type { ContentLookupMap } from './utils.js';

type LazyImport = () => Promise<any>;
type GlobResult = Record<string, LazyImport>;
type CollectionToEntryMap = Record<string, GlobResult>;
type GetEntryImport = (collection: string, lookupId: string) => Promise<LazyImport>;

export function createCollectionToGlobResultMap({
	globResult,
	dir,
}: {
	globResult: GlobResult;
	dir: string;
}) {
	const collectionToGlobResultMap: CollectionToEntryMap = {};
	for (const key in globResult) {
		const keyRelativeToDir = key.replace(new RegExp(`^${dir}`), '');
		const segments = keyRelativeToDir.split('/');
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
			throw new AstroError({
				...AstroErrorData.CollectionDoesNotExistError,
				message: AstroErrorData.CollectionDoesNotExistError.message(collection),
			});
		}
		const lazyImports = Object.values(
			type === 'content'
				? contentCollectionToEntryMap[collection]
				: dataCollectionToEntryMap[collection]
		);
		let entries: any[] = [];
		// Cache `getCollection()` calls in production only
		// prevents stale cache in development
		if (import.meta.env.PROD && cacheEntriesByCollection.has(collection)) {
			entries = cacheEntriesByCollection.get(collection)!;
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
										renderEntryImport: await getRenderEntryImport(collection, entry.id),
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

export function createGetDataEntryById({
	dataCollectionToEntryMap,
}: {
	dataCollectionToEntryMap: CollectionToEntryMap;
}) {
	return async function getDataEntryById(collection: string, id: string) {
		const lazyImport =
			dataCollectionToEntryMap[collection]?.[/*TODO: filePathToIdMap*/ id + '.json'];

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

export function createGetEntry({
	getEntryImport,
	getRenderEntryImport,
}: {
	getEntryImport: GetEntryImport;
	getRenderEntryImport: GetEntryImport;
}) {
	return async function getEntry(
		collectionOrLookupObject:
			| string
			| { collection: string; id: string }
			| { collection: string; slug: string },
		lookupId?: string
	) {
		let collection: string, id: string;
		if (typeof collectionOrLookupObject === 'string') {
			collection = collectionOrLookupObject;
			id = lookupId!;
		} else {
			collection = collectionOrLookupObject.collection;
			id =
				'id' in collectionOrLookupObject
					? collectionOrLookupObject.id
					: collectionOrLookupObject.slug;
		}

		const entryImport = await getEntryImport(collection, id);
		console.log({ id, collection, entryImport });
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
						renderEntryImport: await getRenderEntryImport(collection, id),
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
			// Content is still indentified by slugs, so map to a `slug` key for consistency.
			if (type === 'content') {
				return { slug: lookupId, collection };
			}
			return { id: lookupId, collection };
		});
	};
}

import type { MarkdownHeading } from '@astrojs/markdown-remark';
import { Traverse } from 'neotraverse/modern';
import pLimit from 'p-limit';
import { ZodIssueCode, z } from 'zod';
import type { GetImageResult, ImageMetadata } from '../@types/astro.js';
import { imageSrcToImportId } from '../assets/utils/resolveImports.js';
import { AstroError, AstroErrorData, AstroUserError } from '../core/errors/index.js';
import { prependForwardSlash } from '../core/path.js';
import {
	type AstroComponentFactory,
	createComponent,
	createHeadAndContent,
	renderComponent,
	renderScriptElement,
	renderTemplate,
	renderUniqueStylesheet,
	render as serverRender,
	unescapeHTML,
} from '../runtime/server/index.js';
import { CONTENT_LAYER_TYPE, IMAGE_IMPORT_PREFIX } from './consts.js';
import { type DataEntry, globalDataStore } from './data-store.js';
import type { ContentLookupMap } from './utils.js';

type LazyImport = () => Promise<any>;
type GlobResult = Record<string, LazyImport>;
type CollectionToEntryMap = Record<string, GlobResult>;
type GetEntryImport = (collection: string, lookupId: string) => Promise<LazyImport>;

export function defineCollection(config: any) {
	if ('loader' in config) {
		if (config.type && config.type !== CONTENT_LAYER_TYPE) {
			throw new AstroUserError(
				'Collections that use the Content Layer API must have a `loader` defined and no `type` set.',
				"Check your collection definitions in `src/content/config.*`.'",
			);
		}
		config.type = CONTENT_LAYER_TYPE;
	}
	if (!config.type) config.type = 'content';
	return config;
}

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

export function createGetCollection({
	contentCollectionToEntryMap,
	dataCollectionToEntryMap,
	getRenderEntryImport,
	cacheEntriesByCollection,
}: {
	contentCollectionToEntryMap: CollectionToEntryMap;
	dataCollectionToEntryMap: CollectionToEntryMap;
	getRenderEntryImport: GetEntryImport;
	cacheEntriesByCollection: Map<string, any[]>;
}) {
	return async function getCollection(collection: string, filter?: (entry: any) => unknown) {
		const hasFilter = typeof filter === 'function';
		const store = await globalDataStore.get();
		let type: 'content' | 'data';
		if (collection in contentCollectionToEntryMap) {
			type = 'content';
		} else if (collection in dataCollectionToEntryMap) {
			type = 'data';
		} else if (store.hasCollection(collection)) {
			// @ts-expect-error	virtual module
			const { default: imageAssetMap } = await import('astro:asset-imports');

			const result = [];
			for (const rawEntry of store.values<DataEntry>(collection)) {
				const data = updateImageReferencesInData(rawEntry.data, rawEntry.filePath, imageAssetMap);

				const entry = {
					...rawEntry,
					data,
					collection,
				};
				if (hasFilter && !filter(entry)) {
					continue;
				}
				result.push(entry);
			}
			return result;
		} else {
			console.warn(
				`The collection ${JSON.stringify(
					collection,
				)} does not exist or is empty. Ensure a collection directory with this name exists.`,
			);
			return [];
		}

		const lazyImports = Object.values(
			type === 'content'
				? contentCollectionToEntryMap[collection]
				: dataCollectionToEntryMap[collection],
		);
		let entries: any[] = [];
		// Cache `getCollection()` calls in production only
		// prevents stale cache in development
		if (!import.meta.env?.DEV && cacheEntriesByCollection.has(collection)) {
			entries = cacheEntriesByCollection.get(collection)!;
		} else {
			const limit = pLimit(10);
			entries = await Promise.all(
				lazyImports.map((lazyImport) =>
					limit(async () => {
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
					}),
				),
			);
			cacheEntriesByCollection.set(collection, entries);
		}
		if (hasFilter) {
			return entries.filter(filter);
		} else {
			// Clone the array so users can safely mutate it.
			// slice() is faster than ...spread for large arrays.
			return entries.slice();
		}
	};
}

export function createGetEntryBySlug({
	getEntryImport,
	getRenderEntryImport,
	collectionNames,
}: {
	getEntryImport: GetEntryImport;
	getRenderEntryImport: GetEntryImport;
	collectionNames: Set<string>;
}) {
	return async function getEntryBySlug(collection: string, slug: string) {
		const store = await globalDataStore.get();

		if (!collectionNames.has(collection)) {
			if (store.hasCollection(collection)) {
				throw new AstroError({
					...AstroErrorData.GetEntryDeprecationError,
					message: AstroErrorData.GetEntryDeprecationError.message(collection, 'getEntryBySlug'),
				});
			}
			console.warn(`The collection ${JSON.stringify(collection)} does not exist.`);
			return undefined;
		}

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
	getEntryImport,
	collectionNames,
}: {
	getEntryImport: GetEntryImport;
	collectionNames: Set<string>;
}) {
	return async function getDataEntryById(collection: string, id: string) {
		const store = await globalDataStore.get();

		if (!collectionNames.has(collection)) {
			if (store.hasCollection(collection)) {
				throw new AstroError({
					...AstroErrorData.GetEntryDeprecationError,
					message: AstroErrorData.GetEntryDeprecationError.message(collection, 'getDataEntryById'),
				});
			}
			console.warn(`The collection ${JSON.stringify(collection)} does not exist.`);
			return undefined;
		}

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
	collectionNames,
}: {
	getEntryImport: GetEntryImport;
	getRenderEntryImport: GetEntryImport;
	collectionNames: Set<string>;
}) {
	return async function getEntry(
		// Can either pass collection and identifier as 2 positional args,
		// Or pass a single object with the collection and identifier as properties.
		// This means the first positional arg can have different shapes.
		collectionOrLookupObject: string | EntryLookupObject,
		_lookupId?: string,
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

		const store = await globalDataStore.get();

		if (store.hasCollection(collection)) {
			const entry = store.get<DataEntry>(collection, lookupId);
			if (!entry) {
				console.warn(`Entry ${collection} → ${lookupId} was not found.`);
				return;
			}

			// @ts-expect-error	virtual module
			const { default: imageAssetMap } = await import('astro:asset-imports');
			entry.data = updateImageReferencesInData(entry.data, entry.filePath, imageAssetMap);
			return {
				...entry,
				collection,
			} as DataEntryResult | ContentEntryResult;
		}

		if (!collectionNames.has(collection)) {
			console.warn(`The collection ${JSON.stringify(collection)} does not exist.`);
			return undefined;
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
		entries: { collection: string; id: string }[] | { collection: string; slug: string }[],
	) {
		return Promise.all(entries.map((e) => getEntry(e)));
	};
}

type RenderResult = {
	Content: AstroComponentFactory;
	headings: MarkdownHeading[];
	remarkPluginFrontmatter: Record<string, any>;
};

const CONTENT_LAYER_IMAGE_REGEX = /__ASTRO_IMAGE_="([^"]+)"/g;

async function updateImageReferencesInBody(html: string, fileName: string) {
	// @ts-expect-error Virtual module
	const { default: imageAssetMap } = await import('astro:asset-imports');

	const imageObjects = new Map<string, GetImageResult>();

	// @ts-expect-error Virtual module resolved at runtime
	const { getImage } = await import('astro:assets');

	// First load all the images. This is done outside of the replaceAll
	// function because getImage is async.
	for (const [_full, imagePath] of html.matchAll(CONTENT_LAYER_IMAGE_REGEX)) {
		try {
			const decodedImagePath = JSON.parse(imagePath.replaceAll('&#x22;', '"'));
			const id = imageSrcToImportId(decodedImagePath.src, fileName);

			const imported = imageAssetMap.get(id);
			if (!id || imageObjects.has(id) || !imported) {
				continue;
			}
			const image: GetImageResult = await getImage({ ...decodedImagePath, src: imported });
			imageObjects.set(imagePath, image);
		} catch {
			throw new Error(`Failed to parse image reference: ${imagePath}`);
		}
	}

	return html.replaceAll(CONTENT_LAYER_IMAGE_REGEX, (full, imagePath) => {
		const image = imageObjects.get(imagePath);

		if (!image) {
			return full;
		}

		const { index, ...attributes } = image.attributes;

		return Object.entries({
			...attributes,
			src: image.src,
			srcset: image.srcSet.attribute,
		})
			.map(([key, value]) => (value ? `${key}=${JSON.stringify(String(value))}` : ''))
			.join(' ');
	});
}

function updateImageReferencesInData<T extends Record<string, unknown>>(
	data: T,
	fileName?: string,
	imageAssetMap?: Map<string, ImageMetadata>,
): T {
	return new Traverse(data).map(function (ctx, val) {
		if (typeof val === 'string' && val.startsWith(IMAGE_IMPORT_PREFIX)) {
			const src = val.replace(IMAGE_IMPORT_PREFIX, '');

			const id = imageSrcToImportId(src, fileName);
			if (!id) {
				ctx.update(src);
				return;
			}
			const imported = imageAssetMap?.get(id);
			if (imported) {
				ctx.update(imported);
			} else {
				ctx.update(src);
			}
		}
	});
}

export async function renderEntry(
	entry: DataEntry | { render: () => Promise<{ Content: AstroComponentFactory }> },
) {
	if (!entry) {
		throw new AstroError(AstroErrorData.RenderUndefinedEntryError);
	}

	if ('render' in entry) {
		// This is an old content collection entry, so we use its render method
		return entry.render();
	}

	if (entry.deferredRender) {
		try {
			// @ts-expect-error	virtual module
			const { default: contentModules } = await import('astro:content-module-imports');
			const renderEntryImport = contentModules.get(entry.filePath);
			return render({
				collection: '',
				id: entry.id,
				renderEntryImport,
			});
		} catch (e) {
			console.error(e);
		}
	}

	const html =
		entry?.rendered?.metadata?.imagePaths?.length && entry.filePath
			? await updateImageReferencesInBody(entry.rendered.html, entry.filePath)
			: entry?.rendered?.html;

	const Content = createComponent(() => serverRender`${unescapeHTML(html)}`);
	return {
		Content,
		headings: entry?.rendered?.metadata?.headings ?? [],
		remarkPluginFrontmatter: entry?.rendered?.metadata?.frontmatter ?? {},
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
						slots,
					)}`,
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
		return z
			.union([
				z.string(),
				z.object({
					id: z.string(),
					collection: z.string(),
				}),
				z.object({
					slug: z.string(),
					collection: z.string(),
				}),
			])
			.transform(
				async (
					lookup:
						| string
						| { id: string; collection: string }
						| { slug: string; collection: string },
					ctx,
				) => {
					const flattenedErrorPath = ctx.path.join('.');
					const store = await globalDataStore.get();
					const collectionIsInStore = store.hasCollection(collection);

					if (typeof lookup === 'object') {
						// If these don't match then something is wrong with the reference
						if (lookup.collection !== collection) {
							ctx.addIssue({
								code: ZodIssueCode.custom,
								message: `**${flattenedErrorPath}**: Reference to ${collection} invalid. Expected ${collection}. Received ${lookup.collection}.`,
							});
							return;
						}
						// We won't throw if the collection is missing, because it may be a content layer collection and the store may not yet be populated.
						// If it is an object then we're validating later in the build, so we can check the collection at that point.

						return lookup;
					}

					if (collectionIsInStore) {
						const entry = store.get(collection, lookup);
						if (!entry) {
							ctx.addIssue({
								code: ZodIssueCode.custom,
								message: `**${flattenedErrorPath}**: Reference to ${collection} invalid. Entry ${lookup} does not exist.`,
							});
							return;
						}
						return { id: lookup, collection };
					}
					// If the collection is not in the lookup map or store, it may be a content layer collection and the store may not yet be populated.
					// If the store has 0 or 1 entries it probably means that the entries have not yet been loaded.
					// The store may have a single entry even if the collections have not loaded, because the top-level metadata collection is generated early.
					if (!lookupMap[collection] && store.collections().size <= 1) {
						// For now, we can't validate this reference, so we'll optimistically convert it to a reference object which we'll validate
						// later in the pipeline when we do have access to the store.
						return { id: lookup, collection };
					}

					const { type, entries } = lookupMap[collection];
					const entry = entries[lookup];

					if (!entry) {
						ctx.addIssue({
							code: ZodIssueCode.custom,
							message: `**${flattenedErrorPath}**: Reference to ${collection} invalid. Expected ${Object.keys(
								entries,
							)
								.map((c) => JSON.stringify(c))
								.join(' | ')}. Received ${JSON.stringify(lookup)}.`,
						});
						return;
					}
					// Content is still identified by slugs, so map to a `slug` key for consistency.
					if (type === 'content') {
						return { slug: lookup, collection };
					}
					return { id: lookup, collection };
				},
			);
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

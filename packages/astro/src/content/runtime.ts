import type { MarkdownHeading } from '@astrojs/markdown-remark';
import { escape } from 'html-escaper';
import { Traverse } from 'neotraverse/modern';
import * as z from 'zod/v4';
import type * as zCore from 'zod/v4/core';
import type { GetImageResult, ImageMetadata } from '../assets/types.js';
import { imageSrcToImportId } from '../assets/utils/resolveImports.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
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
import type {
	CacheHint,
	LiveDataCollectionResult,
	LiveDataEntry,
	LiveDataEntryResult,
} from '../types/public/content.js';
import { defineCollection as defineCollectionOrig } from './config.js';
import { IMAGE_IMPORT_PREFIX, type LIVE_CONTENT_TYPE } from './consts.js';
import { type DataEntry, globalDataStore } from './data-store.js';
import {
	LiveCollectionCacheHintError,
	LiveCollectionError,
	LiveCollectionValidationError,
	LiveEntryNotFoundError,
} from './loaders/errors.js';
import type { LiveLoader } from './loaders/types.js';
export {
	LiveCollectionError,
	LiveCollectionCacheHintError,
	LiveEntryNotFoundError,
	LiveCollectionValidationError,
};
type LazyImport = () => Promise<any>;
type LiveCollectionConfigMap = Record<
	string,
	{ loader: LiveLoader; type: typeof LIVE_CONTENT_TYPE; schema?: zCore.$ZodType }
>;

const cacheHintSchema = z.object({
	tags: z.array(z.string()).optional(),
	lastModified: z.date().optional(),
});

async function parseLiveEntry(
	entry: LiveDataEntry,
	schema: zCore.$ZodType,
	collection: string,
): Promise<{ entry?: LiveDataEntry; error?: LiveCollectionError }> {
	try {
		const parsed = await z.safeParseAsync(schema, entry.data);
		if (!parsed.success) {
			return {
				error: new LiveCollectionValidationError(collection, entry.id, parsed.error),
			};
		}
		if (entry.cacheHint) {
			const cacheHint = cacheHintSchema.safeParse(entry.cacheHint);

			if (!cacheHint.success) {
				return {
					error: new LiveCollectionCacheHintError(collection, entry.id, cacheHint.error),
				};
			}
			entry.cacheHint = cacheHint.data;
		}
		return {
			entry: {
				...entry,
				data: parsed.data as Record<string, unknown>,
			},
		};
	} catch (error) {
		return {
			error: new LiveCollectionError(
				collection,
				`Unexpected error parsing entry ${entry.id} in collection ${collection}`,
				error as Error,
			),
		};
	}
}

export function createGetCollection({
	liveCollections,
}: {
	liveCollections: LiveCollectionConfigMap;
}) {
	return async function getCollection(
		collection: string,
		filter?: ((entry: any) => unknown) | Record<string, unknown>,
	) {
		if (collection in liveCollections) {
			throw new AstroError({
				...AstroErrorData.UnknownContentCollectionError,
				message: `Collection "${collection}" is a live collection. Use getLiveCollection() instead of getCollection().`,
			});
		}

		const hasFilter = typeof filter === 'function';
		const store = await globalDataStore.get();
		if (store.hasCollection(collection)) {
			// @ts-expect-error	virtual module
			const { default: imageAssetMap } = await import('astro:asset-imports');

			const result = [];
			for (const rawEntry of store.values<DataEntry>(collection)) {
				const data = updateImageReferencesInData(rawEntry.data, rawEntry.filePath, imageAssetMap);

				let entry = {
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
				)} does not exist or is empty. Please check your content config file for errors.`,
			);
			return [];
		}
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

export function createGetEntry({ liveCollections }: { liveCollections: LiveCollectionConfigMap }) {
	return async function getEntry(
		// Can either pass collection and identifier as 2 positional args,
		// Or pass a single object with the collection and identifier as properties.
		// This means the first positional arg can have different shapes.
		collectionOrLookupObject: string | EntryLookupObject,
		lookup?: string | Record<string, unknown>,
	): Promise<ContentEntryResult | DataEntryResult | undefined> {
		let collection: string, lookupId: string | Record<string, unknown>;
		if (typeof collectionOrLookupObject === 'string') {
			collection = collectionOrLookupObject;
			if (!lookup)
				throw new AstroError({
					...AstroErrorData.UnknownContentCollectionError,
					message: '`getEntry()` requires an entry identifier as the second argument.',
				});
			lookupId = lookup;
		} else {
			collection = collectionOrLookupObject.collection;
			// Identifier could be `slug` for content entries, or `id` for data entries
			lookupId =
				'id' in collectionOrLookupObject
					? collectionOrLookupObject.id
					: collectionOrLookupObject.slug;
		}

		if (collection in liveCollections) {
			throw new AstroError({
				...AstroErrorData.UnknownContentCollectionError,
				message: `Collection "${collection}" is a live collection. Use getLiveEntry() instead of getEntry().`,
			});
		}
		if (typeof lookupId === 'object') {
			throw new AstroError({
				...AstroErrorData.UnknownContentCollectionError,
				message: `The entry identifier must be a string. Received object.`,
			});
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
			const result = {
				...entry,
				collection,
			} as DataEntryResult | ContentEntryResult;
			// TODO: remove in Astro 7
			warnForPropertyAccess(
				result.data,
				'slug',
				`[content] Attempted to access deprecated property on "${collection}" entry.\nThe "slug" property is no longer automatically added to entries. Please use the "id" property instead.`,
			);
			// TODO: remove in Astro 7
			warnForPropertyAccess(
				result,
				'render',
				`[content] Invalid attempt to access "render()" method on "${collection}" entry.\nTo render an entry, use "render(entry)" from "astro:content".`,
			);
			return result;
		}

		return undefined;
	};
}

function warnForPropertyAccess(entry: object, prop: string, message: string) {
	// Skip if the property is already defined (it may be legitimately defined on the entry)
	if (!(prop in entry)) {
		let _value: any = undefined;
		Object.defineProperty(entry, prop, {
			get() {
				// If the user sets value themselves, don't warn
				if (_value === undefined) {
					console.error(message);
				}
				return _value;
			},
			set(v) {
				_value = v;
			},
			enumerable: false,
		});
	}
}

export function createGetEntries(getEntry: ReturnType<typeof createGetEntry>) {
	return async function getEntries(
		entries: { collection: string; id: string }[] | { collection: string; slug: string }[],
	) {
		return Promise.all(entries.map((e) => getEntry(e)));
	};
}

export function createGetLiveCollection({
	liveCollections,
}: {
	liveCollections: LiveCollectionConfigMap;
}) {
	return async function getLiveCollection(
		collection: string,
		filter?: Record<string, unknown>,
	): Promise<LiveDataCollectionResult> {
		if (!(collection in liveCollections)) {
			return {
				error: new LiveCollectionError(
					collection,
					`Collection "${collection}" is not a live collection. Use getCollection() instead of getLiveCollection() to load regular content collections.`,
				),
			};
		}

		try {
			const context = {
				filter,
			};

			const response = await (
				liveCollections[collection].loader as LiveLoader<any, any, Record<string, unknown>>
			)?.loadCollection?.(context);

			// Check if loader returned an error
			if (response && 'error' in response) {
				return { error: response.error };
			}

			const { schema } = liveCollections[collection];

			let processedEntries = response.entries;
			if (schema) {
				const entryResults = await Promise.all(
					response.entries.map((entry) => parseLiveEntry(entry, schema, collection)),
				);

				// Check for parsing errors
				for (const result of entryResults) {
					if (result.error) {
						// Return early on the first error
						return { error: result.error };
					}
				}

				processedEntries = entryResults.map((result) => result.entry!);
			}

			let cacheHint = response.cacheHint;
			if (cacheHint) {
				const cacheHintResult = cacheHintSchema.safeParse(cacheHint);

				if (!cacheHintResult.success) {
					return {
						error: new LiveCollectionCacheHintError(collection, undefined, cacheHintResult.error),
					};
				}
				cacheHint = cacheHintResult.data;
			}

			// Aggregate cache hints from individual entries if any
			if (processedEntries.length > 0) {
				const entryTags = new Set<string>();
				let latestModified: Date | undefined;

				for (const entry of processedEntries) {
					if (entry.cacheHint) {
						if (entry.cacheHint.tags) {
							entry.cacheHint.tags.forEach((tag) => entryTags.add(tag));
						}
						if (entry.cacheHint.lastModified instanceof Date) {
							if (latestModified === undefined || entry.cacheHint.lastModified > latestModified) {
								latestModified = entry.cacheHint.lastModified;
							}
						}
					}
				}

				// Merge collection and entry cache hints
				if (entryTags.size > 0 || latestModified || cacheHint) {
					const mergedCacheHint: CacheHint = {};
					if (cacheHint?.tags || entryTags.size > 0) {
						// Merge and dedupe tags
						mergedCacheHint.tags = [...new Set([...(cacheHint?.tags || []), ...entryTags])];
					}
					if (cacheHint?.lastModified && latestModified) {
						mergedCacheHint.lastModified =
							cacheHint.lastModified > latestModified ? cacheHint.lastModified : latestModified;
					} else if (cacheHint?.lastModified || latestModified) {
						mergedCacheHint.lastModified = cacheHint?.lastModified ?? latestModified;
					}
					cacheHint = mergedCacheHint;
				}
			}

			return {
				entries: processedEntries,
				cacheHint,
			};
		} catch (error) {
			return {
				error: new LiveCollectionError(
					collection,
					`Unexpected error loading collection ${collection}${error instanceof Error ? `: ${error.message}` : ''}`,
					error as Error,
				),
			};
		}
	};
}

export function createGetLiveEntry({
	liveCollections,
}: {
	liveCollections: LiveCollectionConfigMap;
}) {
	return async function getLiveEntry(
		collection: string,
		lookup: string | Record<string, unknown>,
	): Promise<LiveDataEntryResult> {
		if (!(collection in liveCollections)) {
			return {
				error: new LiveCollectionError(
					collection,
					`Collection "${collection}" is not a live collection. Use getCollection() instead of getLiveEntry() to load regular content collections.`,
				),
			};
		}

		try {
			const lookupObject = {
				filter: typeof lookup === 'string' ? { id: lookup } : lookup,
			};

			let entry = await (
				liveCollections[collection].loader as LiveLoader<
					Record<string, unknown>,
					Record<string, unknown>
				>
			)?.loadEntry?.(lookupObject);

			// Check if loader returned an error
			if (entry && 'error' in entry) {
				return { error: entry.error };
			}

			if (!entry) {
				return {
					error: new LiveEntryNotFoundError(collection, lookup),
				};
			}

			const { schema } = liveCollections[collection];
			if (schema) {
				const result = await parseLiveEntry(entry, schema, collection);
				if (result.error) {
					return { error: result.error };
				}
				entry = result.entry!;
			}

			return {
				entry: entry,
				cacheHint: entry.cacheHint,
			};
		} catch (error) {
			return {
				error: new LiveCollectionError(
					collection,
					`Unexpected error loading entry ${collection} → ${typeof lookup === 'string' ? lookup : JSON.stringify(lookup)}`,
					error as Error,
				),
			};
		}
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

			let image: GetImageResult;
			if (URL.canParse(decodedImagePath.src)) {
				// Remote image, pass through without resolving import
				// We know we should resolve this remote image because either:
				// 1. It was collected with the remark-collect-images plugin, which respects the astro image configuration,
				// 2. OR it was manually injected by another plugin, and we should respect that.
				image = await getImage(decodedImagePath);
			} else {
				const id = imageSrcToImportId(decodedImagePath.src, fileName);

				const imported = imageAssetMap.get(id);
				if (!id || imageObjects.has(id) || !imported) {
					continue;
				}
				image = await getImage({ ...decodedImagePath, src: imported });
			}
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
			// This attribute is used by the toolbar audit
			...(import.meta.env.DEV ? { 'data-image-component': 'true' } : {}),
		})
			.map(([key, value]) => (value ? `${key}="${escape(value)}"` : ''))
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

export async function renderEntry(entry: DataEntry) {
	if (!entry) {
		throw new AstroError(AstroErrorData.RenderUndefinedEntryError);
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

export function createReference() {
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
			.transform((lookup, ctx) => {
				if (typeof lookup === 'object') {
					// If these don't match then something is wrong with the reference
					if (lookup.collection !== collection) {
						const flattenedErrorPath = ctx.issues[0]?.path?.join('.');

						ctx.addIssue({
							code: 'custom',
							message: `**${flattenedErrorPath}**: Reference to ${collection} invalid. Expected ${collection}. Received ${lookup.collection}.`,
						});
						return;
					}
					// If it is an object then we're validating later in the build, so we can check the collection at that point.
					return lookup;
				}

				return { id: lookup, collection };
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

export function defineCollection(config: any) {
	if (config.type === 'live') {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'Collections with type `live` must be defined in a `src/live.config.ts` file.',
			),
		});
	}
	return defineCollectionOrig(config);
}

export function defineLiveCollection() {
	throw new AstroError({
		...AstroErrorData.LiveContentConfigError,
		message: AstroErrorData.LiveContentConfigError.message(
			'Live collections must be defined in a `src/live.config.ts` file.',
		),
	});
}

export function createDeprecatedFunction(functionName: string) {
	return (collection: string) => {
		const error = new AstroError({
			...AstroErrorData.GetEntryDeprecationError,
			message: AstroErrorData.GetEntryDeprecationError.message(collection, functionName),
		});

		// Remove the runtime module from the stack trace
		const stackLines = error.stack?.split('\n');
		if (stackLines && stackLines.length > 1) {
			stackLines.splice(1, 1);
			error.stack = stackLines.join('\n');
		}
		throw error;
	};
}

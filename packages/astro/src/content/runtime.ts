import type { MarkdownHeading } from '@astrojs/internal-helpers/markdown';
import { escape } from 'html-escaper';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import * as z from 'zod/v4';
import type { GetImageResult, ImageMetadata } from '../assets/types.js';
import { createSvgComponent } from '../assets/runtime.js';
import { imageSrcToImportId } from '../assets/utils/resolveImports.js';
import { recordContentEntryRender } from '../core/build/incremental-content-collector.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { isRemotePath, prependForwardSlash } from '../core/path.js';
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
import type { LIVE_CONTENT_TYPE } from './consts.js';
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
	{ loader: LiveLoader; type: typeof LIVE_CONTENT_TYPE; schema?: StandardSchemaV1 }
>;

const cacheHintSchema = z.object({
	tags: z.array(z.string()).optional(),
	lastModified: z.date().optional(),
});

async function parseLiveEntry(
	entry: LiveDataEntry,
	schema: StandardSchemaV1,
	collection: string,
): Promise<{ entry?: LiveDataEntry; error?: LiveCollectionError }> {
	try {
		// `validate()` may return a promise, which is what allows async transforms
		const parsed = await schema['~standard'].validate(entry.data);
		if (parsed.issues) {
			return {
				error: new LiveCollectionValidationError(collection, entry.id, parsed.issues),
			};
		}
		if (entry.cacheHint) {
			const cacheHint = cacheHintSchema.safeParse(entry.cacheHint);

			if (!cacheHint.success) {
				return {
					error: new LiveCollectionCacheHintError(collection, entry.id, cacheHint.error.issues),
				};
			}
			entry.cacheHint = cacheHint.data;
		}
		return {
			entry: {
				...entry,
				data: parsed.value as Record<string, unknown>,
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
		if (await store.hasCollection(collection)) {
			// @ts-expect-error	virtual module
			const { default: imageAssetMap } = await import('astro:asset-imports');

			const result = [];
			for (const rawEntry of await store.values<DataEntry>(collection)) {
				const data = resolveEntryData(rawEntry, imageAssetMap);

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
	digest?: string | number;
	render(): Promise<RenderResult>;
};

type DataEntryResult = {
	id: string;
	collection: string;
	data: Record<string, any>;
	digest?: string | number;
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

		if (await store.hasCollection(collection)) {
			const entry = await store.get<DataEntry>(collection, lookupId);
			if (!entry) {
				console.warn(`Entry ${collection} → ${lookupId} was not found.`);
				return;
			}

			// @ts-expect-error	virtual module
			const { default: imageAssetMap } = await import('astro:asset-imports');
			const data = resolveEntryData(entry, imageAssetMap);
			const result = {
				...entry,
				data,
				collection,
			} as DataEntryResult | ContentEntryResult;
			// TODO: remove in Astro 8
			warnForPropertyAccess(
				result.data,
				'slug',
				`[content] Attempted to access deprecated property on "${collection}" entry.\nThe "slug" property is no longer automatically added to entries. Please use the "id" property instead.`,
			);
			// TODO: remove in Astro 8
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
				collection,
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
						error: new LiveCollectionCacheHintError(
							collection,
							undefined,
							cacheHintResult.error.issues,
						),
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
				collection,
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

	const { getImage } = await import('virtual:astro:get-image');

	// First load all the images. This is done outside of the replaceAll
	// function because getImage is async.
	for (const [_full, imagePath] of html.matchAll(CONTENT_LAYER_IMAGE_REGEX)) {
		try {
			// Markdown processors disagree on which character references to emit when
			// serialising attribute values: remark uses the numeric forms (`&#x22;` / `&#x27;`),
			// satteri uses the named forms (`&quot;` / `&apos;`). Decode both before JSON.parse.
			const decodedImagePath = JSON.parse(
				imagePath.replace(/&(?:#x22|quot);/g, '"').replace(/&(?:#x27|apos);/g, "'"),
			);

			let resolvedImage: GetImageResult;
			if (URL.canParse(decodedImagePath.src)) {
				// Remote image, pass through without resolving import
				// We know we should resolve this remote image because either:
				// 1. It was collected with the remark-collect-images plugin, which respects the astro image configuration,
				// 2. OR it was manually injected by another plugin, and we should respect that.
				resolvedImage = await getImage(decodedImagePath);
			} else {
				const id = imageSrcToImportId(decodedImagePath.src, fileName);

				const imported = imageAssetMap.get(id);
				if (!id || imageObjects.has(id) || !imported) {
					continue;
				}
				resolvedImage = await getImage({ ...decodedImagePath, src: imported });
			}
			imageObjects.set(imagePath, resolvedImage);
		} catch {
			throw new Error(`Failed to parse image reference: ${imagePath}`);
		}
	}

	return html.replaceAll(CONTENT_LAYER_IMAGE_REGEX, (full, imagePath) => {
		const resolvedImage = imageObjects.get(imagePath);

		if (!resolvedImage) {
			return full;
		}

		const { index, ...attributes } = resolvedImage.attributes;

		return Object.entries({
			...attributes,
			src: resolvedImage.src,
			srcset: resolvedImage.srcSet.attribute,
			// This attribute is used by the toolbar audit
			...(import.meta.env.DEV ? { 'data-image-component': 'true' } : {}),
		})
			.filter(([, value]) => value != null)
			.map(([key, value]) => (value === '' ? `${key}=""` : `${key}="${escape(String(value))}"`))
			.join(' ');
	});
}

/**
 * Resolves the image src at `path` within `data` to its `ImageMetadata` (or a
 * renderable SVG component). Returns the resolved value, or `undefined` when the
 * image is not in the asset map and the plain src already stored in `data` should
 * be kept.
 */
function resolveImageAtPath(
	src: string,
	fileName: string | undefined,
	imageAssetMap: Map<string, ImageMetadata> | undefined,
): unknown {
	const id = imageSrcToImportId(src, fileName);
	if (!id) {
		return undefined;
	}
	const imported = imageAssetMap?.get(id) as
		| (ImageMetadata & {
				__svgData?: {
					attributes: Record<string, string>;
					children: string;
					styles: string[];
				};
		  })
		| undefined;
	if (!imported) {
		return undefined;
	}
	if (imported.__svgData) {
		// Reconstruct the renderable SVG component from the data embedded at build
		// time. We cannot call createSvgComponent inside the SVG Vite module itself
		// because that would import the server runtime across a dynamic-import
		// boundary, recreating the TLA circular-dependency deadlock (see #15575).
		const { __svgData: svgData, ...meta } = imported;
		return createSvgComponent({ meta: meta as ImageMetadata, ...svgData });
	}
	return imported;
}

/**
 * Writes `value` at `path` within `target`, copying only the containers along
 * that path so the shared store entry is never mutated. Sibling values and every
 * container off the path are shared by reference, so values that `structuredClone`
 * cannot handle (e.g. `Temporal` objects or class instances from Zod transforms)
 * are never touched.
 */
function setAtPathCopying<T extends Record<string, unknown>>(
	target: T,
	path: (string | number)[],
	value: unknown,
): T {
	if (path.length === 0) {
		return target;
	}
	const [key, ...rest] = path;
	const copy: any = Array.isArray(target) ? target.slice() : { ...target };
	copy[key] = rest.length === 0 ? value : setAtPathCopying(copy[key], rest, value);
	return copy;
}

export function updateImageReferencesInData<T extends Record<string, unknown>>(
	data: T,
	fileName?: string,
	imageAssetMap?: Map<string, ImageMetadata>,
	imageImports?: (string | number)[][],
): T {
	if (!imageImports?.length) {
		return data;
	}
	let result = data;
	for (const path of imageImports) {
		let current: unknown = result;
		for (const key of path) {
			current = (current as Record<string | number, unknown>)?.[key];
		}

		// String form: the whole field is the marker, so replace it outright.
		if (typeof current === 'string') {
			const resolved = resolveImageAtPath(current, fileName, imageAssetMap);
			if (resolved !== undefined) {
				result = setAtPathCopying(result, path, resolved);
			}
			continue;
		}

		// Object form (from `image()`): merge so that fields added by transforms
		// downstream of `image()` survive resolution.
		if (current && typeof current === 'object' && typeof (current as any).src === 'string') {
			const resolved = resolveImageAtPath((current as any).src, fileName, imageAssetMap);
			if (resolved === undefined) {
				continue;
			}
			result = setAtPathCopying(
				result,
				path,
				// SVGs resolve to a component factory rather than metadata, so there is
				// nothing to merge into.
				typeof resolved === 'function'
					? resolved
					: { ...(current as object), ...(resolved as object) },
			);
		}
	}
	return result;
}

export function resolveEntryData<T extends Record<string, unknown>>(
	entry: DataEntry<T>,
	imageAssetMap?: Map<string, ImageMetadata>,
): T {
	return updateImageReferencesInData(entry.data, entry.filePath, imageAssetMap, entry.imageImports);
}

export async function renderEntry(entry: DataEntry) {
	if (!entry) {
		throw new AstroError(AstroErrorData.RenderUndefinedEntryError);
	}
	recordContentEntryRender(entry.filePath);

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
								src: isRemotePath(link) ? link : prependForwardSlash(link),
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

/**
 * What `reference()` resolves to, and what `getEntry()`/`getEntries()` accept.
 *
 * The `slug` variant only ever comes back out when it went in: a legacy reference object is
 * passed through untouched rather than renamed, so re-parsing already-transformed data is a
 * no-op.
 */
export type ReferenceField =
	| { collection: string; id: string }
	| { collection: string; slug: string };

/** Every value `reference()` accepts as an entry lookup. */
export type ReferenceLookup = string | number | ReferenceField;

/**
 * The resolution shared by both `reference()` signatures.
 *
 * Reports failure instead of throwing, so the deprecated schema form can surface it as a
 * validation issue — collected alongside the schema's other issues — while the function
 * form, which has no validator to report through, throws.
 *
 * Note what is *not* checked here: whether the entry exists. A reference may point at a
 * collection whose loader has not run yet, so existence is verified once every loader has
 * finished, by walking the store (`ContentLayer#validateReferences`).
 */
function resolveReference(
	collection: string,
	lookup: unknown,
): { ok: true; value: ReferenceField } | { ok: false; message: string } {
	if (typeof lookup === 'number') {
		return { ok: true, value: { id: lookup.toString(10), collection } };
	}
	if (typeof lookup === 'string') {
		return { ok: true, value: { id: lookup, collection } };
	}
	if (lookup !== null && typeof lookup === 'object') {
		const entry = lookup as { collection?: unknown; id?: unknown; slug?: unknown };
		if (typeof entry.collection === 'string') {
			// Already a reference object, so the schema is running over data an earlier parse
			// transformed. The collection is the one thing we can still check.
			if (entry.collection !== collection) {
				return {
					ok: false,
					message: `expected a reference to \`${collection}\`, but received one to \`${entry.collection}\`.`,
				};
			}
			if (typeof entry.id === 'string') {
				return { ok: true, value: { id: entry.id, collection } };
			}
			if (typeof entry.slug === 'string') {
				return { ok: true, value: { slug: entry.slug, collection } };
			}
		}
	}
	return {
		ok: false,
		message: `expected an entry id, as a string or a number, but received ${JSON.stringify(lookup) ?? typeof lookup}.`,
	};
}

/**
 * Two signatures, kept apart by whether a lookup was passed.
 *
 * `reference(collection, id)` is an ordinary function, so it composes with any validator and
 * its result can be validated further:
 *
 * ```js
 * schema: z.object({
 *   author: z.string().transform((id) => reference('authors', id)),
 * })
 * ```
 *
 * `reference(collection)` returns a Zod schema instead, and only works in a Zod schema. It
 * is deprecated, and routed through the same resolution.
 */
export interface ReferenceFunction {
	/**
	 * @deprecated Pass the entry id as a second argument instead. `reference(collection, id)`
	 * is an ordinary function rather than a schema factory, so it works with any validator and
	 * its result can be validated further:
	 *
	 * ```js
	 * schema: z.object({
	 *   author: z.string().transform((id) => reference('authors', id)),
	 * })
	 * ```
	 */
	(collection: string): z.ZodType<ReferenceField, ReferenceLookup>;
	(collection: string, lookup: ReferenceLookup): ReferenceField;
}

export function createReference(): ReferenceFunction {
	function reference(collection: string): z.ZodType<ReferenceField, ReferenceLookup>;
	function reference(collection: string, lookup: ReferenceLookup): ReferenceField;
	function reference(
		collection: string,
		...rest: [] | [ReferenceLookup]
	): ReferenceField | z.ZodType<ReferenceField, ReferenceLookup> {
		// Arity, not the value: `reference('authors', undefined)` is a mistake worth reporting,
		// not a request for the deprecated schema form.
		if (rest.length > 0) {
			const resolved = resolveReference(collection, rest[0]);
			if (!resolved.ok) {
				throw new AstroError({
					...AstroErrorData.InvalidContentReferenceError,
					message: AstroErrorData.InvalidContentReferenceError.message(
						collection,
						resolved.message,
					),
				});
			}
			return resolved.value;
		}

		// Deprecated schema form. The union stays in front of the resolution so that a value of
		// the wrong type is still reported by Zod, with its own message and path.
		return z
			.union([
				z.number(),
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
				const resolved = resolveReference(collection, lookup);
				if (!resolved.ok) {
					ctx.addIssue({ code: 'custom', message: resolved.message });
					return z.NEVER;
				}
				return resolved.value;
			});
	}

	return reference;
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

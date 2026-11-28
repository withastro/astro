declare module 'astro:content' {
	import zod from 'astro/zod';
	export type {
		ImageFunction,
		DataEntry,
		DataStore,
		MetaStore,
		BaseSchema,
		SchemaContext,
	} from 'astro/content/config';
	export { defineLiveCollection, defineCollection } from 'astro/content/config';

	// TODO: remove in Astro 8
	/**
	 * @deprecated
	 * `import { z } from 'astro:content'` is deprecated and will be removed
	 * in Astro 8. Use `import { z } from 'astro/zod'` instead.
	 */
	export const z = zod.z;

	/**
	 * Maps build-time collection names to the `data` type of their entries. Astro infers
	 * each type from the collection schema, or from the loader if it provides a schema.
	 *
	 * Augment this interface to declare a collection Astro cannot infer:
	 *
	 * ```ts
	 * declare module 'astro:content' {
	 *   interface DataMap {
	 *     changelog: { version: string; date: Date };
	 *   }
	 * }
	 * ```
	 */
	export interface DataMap {}

	/**
	 * Live collections, keyed by collection name. Inferred from `src/live.config.ts` by
	 * `astro sync`, and augmentable the same way as {@link DataMap}:
	 *
	 * ```ts
	 * declare module 'astro:content' {
	 *   interface LiveDataMap {
	 *     products: { data: { name: string; price: number }; entryFilter: { sku: string } };
	 *   }
	 * }
	 * ```
	 *
	 * Declare only the properties you need. `data` is the entry data after validation.
	 * `entryFilter` and `collectionFilter` are the filters accepted by `getLiveEntry()`
	 * and `getLiveCollection()`, respectively. `error` is the error type the loader can return.
	 */
	export interface LiveDataMap {}

	/**
	 * The type of one collection's entry data, inferred from the schema the config declares for
	 * it. This is what `astro sync` writes into `.astro/content.d.ts`, one line per collection:
	 *
	 * ```ts
	 * declare module 'astro:content' {
	 *   type ContentConfig = typeof import('../src/content.config.js');
	 *
	 *   interface DataMap {
	 *     blog: InferCollectionData<ContentConfig, 'blog'>;
	 *   }
	 * }
	 * ```
	 *
	 * The names are written out rather than inferred so that `keyof DataMap` is known without
	 * resolving the config: `reference()` is called from inside the config and is typed by the
	 * collections it declares, so a `DataMap` inferred whole would make the config's type
	 * depend on itself, and every collection in it would silently become `any`.
	 */
	export type InferCollectionData<
		TConfig,
		TName extends string,
	> = import('astro/content/config').InferCollectionData<TConfig, TName>;

	/**
	 * Every collection of a content config, mapped to the type of its entry data. Safe as
	 * `interface DataMap extends InferData<ContentConfig> {}` for a config that never calls
	 * `reference()`; {@link InferCollectionData} is what `astro sync` generates, and what to
	 * reach for otherwise.
	 */
	export type InferData<TConfig> = import('astro/content/config').InferData<TConfig>;

	/** The {@link LiveDataMap} of a live config module. The live counterpart of {@link InferData}. */
	export type InferLiveData<TConfig> = import('astro/content/config').InferLiveData<TConfig>;

	/**
	 * `DataMap` is empty until `astro sync` (or `astro dev`) has generated the types for the
	 * project, and an empty map would make every collection an error. Until then, any
	 * collection name is accepted and its data is `any`, the same as it was before the config
	 * was read.
	 */
	type ResolvedDataMap = [keyof DataMap] extends [never] ? Record<string, any> : DataMap;
	type ResolvedLiveDataMap = [keyof LiveDataMap] extends [never]
		? Record<string, any>
		: LiveDataMap;

	export type CollectionKey = keyof ResolvedDataMap;
	export type LiveCollectionKey = keyof ResolvedLiveDataMap;

	export interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	/** Render results by file extension. Markdown integrations augment this with their own. */
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}

	/** An entry of the `C` collection, as `getCollection()` and `getEntry()` return it. */
	export type CollectionEntry<C extends CollectionKey> = C extends CollectionKey
		? {
				id: string;
				body?: string;
				collection: C;
				data: ResolvedDataMap[C];
				rendered?: RenderedContent;
				filePath?: string;
				digest?: string | number;
			}
		: never;

	export type ReferenceDataEntry<
		C extends CollectionKey,
		E extends string = string,
	> = import('../dist/content/runtime.js').EntryReference<C, E>;

	export type ReferenceLiveEntry<C extends LiveCollectionKey> = {
		collection: C;
		id: string;
	};

	export function getCollection<C extends CollectionKey, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends CollectionKey>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<C extends CollectionKey, E extends string = string>(
		entry: ReferenceDataEntry<C, E>,
	): Promise<CollectionEntry<C>>;
	export function getEntry<C extends CollectionKey, E extends string = string>(
		collection: C,
		id: E,
	): Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends CollectionKey>(
		entries: ReferenceDataEntry<C>[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends CollectionKey>(entry: CollectionEntry<C>): Promise<RenderResult>;
	export function render<C extends LiveCollectionKey>(
		entry: import('astro').LiveDataEntry<LiveData<C>>,
	): Promise<RenderResult>;

	/**
	 * The schema preserves `slug` when it receives a legacy reference object.
	 * @deprecated Use `reference(collection, id)` from `astro/content/fields` in a schema transform. This export will be removed in Astro 8.
	 */
	export function reference<
		C extends
			| CollectionKey
			// Generated types can lag behind config edits. The build checks collection names.
			| (string & {}),
	>(
		collection: C,
	): import('astro/zod').ZodType<
		C extends CollectionKey ? ReferenceDataEntry<C> : never,
		import('../dist/content/runtime.js').ReferenceLookup<C>
	>;

	type LiveTypes<C extends LiveCollectionKey> = ResolvedLiveDataMap[C];
	type LiveData<C extends LiveCollectionKey> =
		LiveTypes<C> extends { data: infer TData } ? TData : any;
	type LiveEntryFilter<C extends LiveCollectionKey> =
		LiveTypes<C> extends {
			entryFilter: infer TFilter;
		}
			? TFilter
			: never;
	type LiveCollectionFilter<C extends LiveCollectionKey> =
		LiveTypes<C> extends {
			collectionFilter: infer TFilter;
		}
			? TFilter
			: never;
	type LiveError<C extends LiveCollectionKey> =
		LiveTypes<C> extends { error: infer TError } ? TError : Error;

	export function getLiveCollection<C extends LiveCollectionKey>(
		collection: C,
		filter?: LiveCollectionFilter<C>,
	): Promise<import('astro').LiveDataCollectionResult<LiveData<C>, LiveError<C>>>;

	export function getLiveEntry<C extends LiveCollectionKey>(
		collection: C,
		filter: string | LiveEntryFilter<C>,
	): Promise<import('astro').LiveDataEntryResult<LiveData<C>, LiveError<C>>>;

	// TODO: remove in Astro 8
	/** @deprecated Use `getEntry()` instead. This function will be removed in Astro 8. */
	export const getEntryBySlug: (...args: any[]) => any;
	// TODO: remove in Astro 8
	/** @deprecated Use `getEntry()` instead. This function will be removed in Astro 8. */
	export const getDataEntryById: (...args: any[]) => any;

	// TODO: remove in Astro 8
	/**
	 * @deprecated Use `DataMap`, which maps a collection to the type of its `data` rather than
	 * to a record of its entries. This type will be removed in Astro 8.
	 */
	export type DataEntryMap = {
		[C in CollectionKey]: Record<string, CollectionEntry<C>>;
	};
	// TODO: remove in Astro 8
	/** @deprecated Use `CollectionKey` for both content and data collections. This type will be removed in Astro 8. */
	export type ContentCollectionKey = CollectionKey;
	// TODO: remove in Astro 8
	/** @deprecated Use `CollectionKey` for both content and data collections. This type will be removed in Astro 8. */
	export type DataCollectionKey = CollectionKey;
	// TODO: remove in Astro 8
	/** @deprecated Use `CollectionEntry<C>['data']`. This type will be removed in Astro 8. */
	export type InferEntrySchema<C extends CollectionKey> = ResolvedDataMap[C];
	// TODO: remove in Astro 8
	/** @deprecated Use `CollectionEntry<C>['data']`. This type will be removed in Astro 8. */
	export type InferLoaderSchema<C extends CollectionKey, L = never> = [L] extends [never]
		? ResolvedDataMap[C]
		: L extends { schema: import('@standard-schema/spec').StandardSchemaV1<unknown, infer Output> }
			? Output
			: any;
}

declare module 'astro/content/fields' {
	export const image: typeof import('../dist/content/image.js').image;

	/**
	 * Creates an entry reference in a schema transform. Numeric IDs become strings.
	 * An existing reference to the same collection supplies its `id` or legacy `slug`.
	 * The returned reference always uses `id`.
	 * @throws If the lookup is invalid or refers to a different collection.
	 */
	export function reference<C extends import('astro:content').CollectionKey | (string & {})>(
		collection: C,
		lookup: import('../dist/content/runtime.js').ReferenceLookup<C>,
	): C extends import('astro:content').CollectionKey
		? import('astro:content').ReferenceDataEntry<C>
		: never;
}

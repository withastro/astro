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
	 * in Astro 8. Install `zod` and use `import { z } from 'zod'` instead.
	 */
	export const z = zod.z;

	/**
	 * The `data` of every collection, keyed by collection name. This is the only thing
	 * `astro sync` generates — it infers this interface from `src/content.config.ts` — and
	 * everything else in `astro:content` is derived from it.
	 *
	 * It is an interface, so anything that knows a collection Astro cannot infer can add it.
	 * An integration shipping its own collection, or a project typing one by hand:
	 *
	 * ```ts
	 * declare module 'astro:content' {
	 *   interface DataMap {
	 *     blog: { title: string; heroImage?: ImageMetadata };
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
	 *     products: { data: Product; entryFilter: { sku: string } };
	 *   }
	 * }
	 * ```
	 *
	 * A hand-written entry only has to declare the parts it uses. `data` is what the loader
	 * returns, `entryFilter` and `collectionFilter` are what `getLiveEntry()` and
	 * `getLiveCollection()` accept, and `error` is what the loader can fail with.
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

	export type ReferenceDataEntry<C extends CollectionKey> = {
		collection: C;
		id: string;
	};

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

	export function getEntry<C extends CollectionKey>(
		entry: ReferenceDataEntry<C>,
	): Promise<CollectionEntry<C>>;
	export function getEntry<C extends CollectionKey>(
		collection: C,
		id: string,
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
	 * Every value `reference()` accepts as an entry lookup. An already-resolved reference is
	 * accepted, and passed through, so that re-parsing transformed data is a no-op.
	 */
	type ReferenceLookup<C> =
		| string
		| number
		| { collection: C; id: string }
		| { collection: C; slug: string };

	/**
	 * Resolve an entry id to a reference to an entry in another collection.
	 *
	 * Call it from inside a schema transform, so it composes with any validator and its result
	 * can be validated further:
	 *
	 * ```js
	 * schema: z.object({
	 *   author: z.string().transform((id) => reference('authors', id)),
	 * })
	 * ```
	 */
	export function reference<
		C extends
			| CollectionKey
			// Allow generic `string` to avoid excessive type errors in the config
			// if `dev` is not running to update as you edit.
			// Invalid collection names will be caught at build time.
			| (string & {}),
	>(
		collection: C,
		lookup: ReferenceLookup<C>,
	): C extends CollectionKey ? ReferenceDataEntry<C> : never;

	/**
	 * @deprecated Pass the entry id as a second argument instead. `reference(collection, id)` is
	 * an ordinary function rather than a schema factory, so it works with any validator and its
	 * result can be validated further:
	 *
	 * ```js
	 * schema: z.object({
	 *   author: z.string().transform((id) => reference('authors', id)),
	 * })
	 * ```
	 */
	export function reference<
		C extends
			| CollectionKey
			// Allow generic `string` to avoid excessive type errors in the config
			// if `dev` is not running to update as you edit.
			// Invalid collection names will be caught at build time.
			| (string & {}),
	>(
		collection: C,
	): import('astro/zod').ZodType<
		C extends CollectionKey ? ReferenceDataEntry<C> : never,
		ReferenceLookup<C>
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
	/** @deprecated Use `getEntry()` instead. */
	export const getEntryBySlug: (...args: any[]) => any;
	// TODO: remove in Astro 8
	/** @deprecated Use `getEntry()` instead. */
	export const getDataEntryById: (...args: any[]) => any;

	// TODO: remove in Astro 8
	/**
	 * @deprecated Use `DataMap`, which maps a collection to the type of its `data` rather than
	 * to a record of its entries.
	 */
	export type DataEntryMap = {
		[C in CollectionKey]: Record<string, CollectionEntry<C>>;
	};
	// TODO: remove in Astro 8
	/** @deprecated Use `CollectionKey`. Content and data collections are no longer distinct. */
	export type ContentCollectionKey = CollectionKey;
	// TODO: remove in Astro 8
	/** @deprecated Use `CollectionKey`. Content and data collections are no longer distinct. */
	export type DataCollectionKey = CollectionKey;
	// TODO: remove in Astro 8
	/** @deprecated Use `CollectionEntry<C>['data']`. */
	export type InferEntrySchema<C extends CollectionKey> = ResolvedDataMap[C];
	// TODO: remove in Astro 8
	/** @deprecated Use `CollectionEntry<C>['data']`. */
	export type InferLoaderSchema<C extends CollectionKey> = ResolvedDataMap[C];
}

import type { StandardJSONSchemaV1, StandardSchemaV1 } from '@standard-schema/spec';
import type * as zCore from 'zod/v4/core';
import type * as z from 'zod/v4';
import { AstroError, AstroErrorData, AstroUserError } from '../core/errors/index.js';
import { CONTENT_LAYER_TYPE, LIVE_CONTENT_TYPE } from './consts.js';
import type { LiveLoader, Loader } from './loaders/types.js';

function getImporterFilename() {
	// Find the first line in the stack trace that doesn't include 'defineCollection' or 'getImporterFilename'
	const stackLine = new Error().stack
		?.split('\n')
		.find(
			(line) =>
				!line.includes('defineCollection') &&
				!line.includes('defineLiveCollection') &&
				!line.includes('getImporterFilename') &&
				!line.startsWith('Error'),
		);
	if (!stackLine) {
		return undefined;
	}
	// Extract the relative path from the stack line
	const match = /\/((?:src|chunks)\/.*?):\d+:\d+/.exec(stackLine);

	return match?.[1] ?? undefined;
}

// This needs to be in sync with ImageMetadata
type ImageFunction = () => z.ZodObject<{
	src: zCore.$ZodString;
	width: zCore.$ZodNumber;
	height: zCore.$ZodNumber;
	format: zCore.$ZodUnion<
		[
			zCore.$ZodLiteral<'png'>,
			zCore.$ZodLiteral<'jpg'>,
			zCore.$ZodLiteral<'jpeg'>,
			zCore.$ZodLiteral<'tiff'>,
			zCore.$ZodLiteral<'webp'>,
			zCore.$ZodLiteral<'gif'>,
			zCore.$ZodLiteral<'svg'>,
			zCore.$ZodLiteral<'avif'>,
			zCore.$ZodLiteral<'apng'>,
		]
	>;
}>;

export interface DataEntry {
	id: string;
	data: Record<string, unknown>;
	filePath?: string;
	body?: string;
}

export interface DataStore {
	get: (key: string) => DataEntry;
	entries: () => Array<[id: string, DataEntry]>;
	set: (key: string, data: Record<string, unknown>, body?: string, filePath?: string) => void;
	values: () => Array<DataEntry>;
	keys: () => Array<string>;
	delete: (key: string) => void;
	clear: () => void;
	has: (key: string) => boolean;
}

export interface MetaStore {
	get: (key: string) => string | undefined;
	set: (key: string, value: string) => void;
	delete: (key: string) => void;
	has: (key: string) => boolean;
}

/**
 * Any [Standard Schema](https://standardschema.dev) validator: Zod, Valibot, ArkType, and
 * others. Astro validates collection entries through the standard interface, so it is not
 * tied to a single validation library.
 */
export type BaseSchema = StandardSchemaV1;

/**
 * A schema that can additionally describe itself as JSON Schema, per
 * https://standardschema.dev/json-schema. Astro uses this to generate the `.schema.json`
 * files that give data collections autocompletion and validation in editors.
 *
 * This is a capability, not a requirement: a collection schema is only ever typed as
 * `BaseSchema`, and the extra methods are detected at runtime. Validators that do not
 * implement the JSON Schema spec still work; only the generated JSON Schema is skipped.
 */
export type JSONSchemaCapableSchema = StandardSchemaV1 & StandardJSONSchemaV1;

/** The type an entry has once it has been validated by `S`. */
export type InferSchemaOutput<S> = S extends StandardSchemaV1
	? StandardSchemaV1.InferOutput<S>
	: never;

/** The type an entry must have before it is validated by `S`. */
export type InferSchemaInput<S> = S extends StandardSchemaV1
	? StandardSchemaV1.InferInput<S>
	: never;

export type { ImageFunction };

export interface SchemaContext {
	/**
	 * Absolute path of the entry being parsed, when the loader provides one. Pass the
	 * whole context to `image()` from `astro/content/image` to resolve a source relative
	 * to it.
	 */
	filePath: string;
	/**
	 * @deprecated Use `image()` from `astro/content/image` instead, which is an ordinary
	 * function rather than a schema factory, so it works with any validator and its result
	 * can be validated further:
	 *
	 * ```js
	 * schema: (context) => z.object({
	 *   cover: z.string().transform((src) => image(context, { src })),
	 * })
	 * ```
	 */
	image: ImageFunction;
}

type LoaderConstraint<TData extends { id: string }> =
	| Loader
	| (() =>
			| Array<TData>
			| Promise<Array<TData>>
			| Record<string, Omit<TData, 'id'> & { id?: string }>
			| Promise<Record<string, Omit<TData, 'id'> & { id?: string }>>);

type ContentLayerConfig<S extends BaseSchema, TLoader extends LoaderConstraint<{ id: string }>> = {
	type?: 'content_layer';
	schema?: S | ((context: SchemaContext) => S);
	loader: TLoader;
};

type DataCollectionConfig<S extends BaseSchema> = {
	type: 'data';
	schema?: S | ((context: SchemaContext) => S);
};

type ContentCollectionConfig<S extends BaseSchema> = {
	type?: 'content';
	schema?: S | ((context: SchemaContext) => S);
	loader?: never;
};

export type LiveCollectionConfig<
	L extends LiveLoader,
	S extends BaseSchema | undefined = undefined,
> = {
	type?: 'live';
	schema?: S;
	loader: L;
};

export type CollectionConfig<
	S extends BaseSchema = BaseSchema,
	TLoader extends LoaderConstraint<{ id: string }> = LoaderConstraint<{ id: string }>,
> = ContentCollectionConfig<S> | DataCollectionConfig<S> | ContentLayerConfig<S, TLoader>;

export function defineLiveCollection<
	L extends LiveLoader,
	S extends BaseSchema | undefined = undefined,
>(config: LiveCollectionConfig<L, S>): LiveCollectionConfig<L, S> {
	const importerFilename = getImporterFilename();
	if (importerFilename && !importerFilename.includes('live.config')) {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'Live collections must be defined in a `src/live.config.ts` file.',
				importerFilename ?? 'your content config file',
			),
		});
	}
	// Default to live content type if not specified
	config.type ??= LIVE_CONTENT_TYPE;

	if (config.type !== LIVE_CONTENT_TYPE) {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'Collections in a live config file must have a type of `live`.',
				importerFilename,
			),
		});
	}

	if (!config.loader) {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'Live collections must have a `loader` defined.',
				importerFilename,
			),
		});
	}

	if (!config.loader.loadCollection || !config.loader.loadEntry) {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'Live collection loaders must have `loadCollection()` and `loadEntry()` methods. Please check that you are not using a loader intended for build-time collections',
				importerFilename,
			),
		});
	}

	if (typeof config.schema === 'function') {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'The schema cannot be a function for live collections. Please use a schema object instead.',
				importerFilename,
			),
		});
	}

	return config;
}

export function defineCollection<T extends CollectionConfig>(config: T): T {
	const importerFilename = getImporterFilename();

	if (importerFilename?.includes('live.config')) {
		throw new AstroError({
			...AstroErrorData.LiveContentConfigError,
			message: AstroErrorData.LiveContentConfigError.message(
				'Collections in a live config file must use `defineLiveCollection`.',
				importerFilename,
			),
		});
	}

	if ('loader' in config) {
		if (config.type && config.type !== CONTENT_LAYER_TYPE) {
			throw new AstroUserError(
				`A content collection is defined with legacy features (e.g. missing a \`loader\` or has a \`type\`). Check your collection definitions in ${importerFilename ?? 'your content config file'} to ensure that all collections are defined using the current properties.`,
			);
		}
		if (
			typeof config.loader === 'object' &&
			typeof config.loader.load !== 'function' &&
			('loadEntry' in config.loader || 'loadCollection' in config.loader)
		) {
			throw new AstroUserError(
				`Live content collections must be defined in "src/live.config.ts" file. Check the loaders used in "${importerFilename ?? 'your content config file'}" to ensure you are not using a live loader to define a build-time content collection.`,
			);
		}
		config.type = CONTENT_LAYER_TYPE;
	}
	if (!config.type) config.type = 'content';
	return config;
}

/**
 * Collection types are inferred from the content config rather than written out collection by
 * collection, so `astro sync` only has to generate the two lines that point `astro:content` at
 * the project's config. Everything below is the type-level half of that: given the module type
 * of a content config, it produces the map of collection name to entry data that the generated
 * `DataMap` interface extends.
 */

type Defined<T> = Exclude<T, undefined>;

/** Whether `S` is a schema rather than the absence of one. */
type HasSchema<S> = [Defined<S>] extends [never] ? false : true;

/** A schema is either passed directly or returned by a factory that receives the context. */
type ResolveSchema<S> = S extends (context: SchemaContext) => infer R ? R : S;

/**
 * The schema declared on the collection itself, if it has one. Declaring it is what counts,
 * not whether the property is optional: a config that never mentions `schema` has no schema to
 * infer from, while one typed as `schema?: S` does.
 */
type CollectionSchema<TCollection> = 'schema' extends keyof TCollection
	? ResolveSchema<Defined<TCollection['schema']>>
	: never;

/**
 * The schema declared by the collection's loader, if it has one. A loader that builds its
 * schema while loading (`createSchema()`) has nothing to infer from here: `astro sync` writes
 * the type it generated straight into `DataMap` instead.
 */
type LoaderSchema<TCollection> = TCollection extends { loader: { schema: infer S } }
	? // The function form of a loader schema is ignored at runtime, so it is ignored here too.
		S extends (...args: Array<any>) => any
		? never
		: S
	: never;

/**
 * The type of an entry's `data`, from the collection's own definition. A schema on the
 * collection wins over one on its loader, and a collection with neither is unvalidated, so its
 * data is `any`.
 */
type InferSchemaData<TCollection> =
	HasSchema<CollectionSchema<TCollection>> extends true
		? InferSchemaOutput<Defined<CollectionSchema<TCollection>>>
		: HasSchema<LoaderSchema<TCollection>> extends true
			? InferSchemaOutput<Defined<LoaderSchema<TCollection>>>
			: any;

/**
 * The type of an entry's `data` in the `TName` collection of a content config. `astro sync`
 * writes one of these per collection, so that the names in `DataMap` are known without
 * resolving the config it reads them from — see {@link InferData}.
 */
export type InferCollectionData<TConfig, TName extends string> = [TConfig] extends [never]
	? // No content config to read, as when a project has none at all.
		any
	: TConfig extends { collections: infer TCollections }
		? TName extends keyof TCollections
			? InferSchemaData<TCollections[TName]>
			: any
		: any;

/**
 * The map of a config with no collections to read: no names, and so no data behind them.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type EmptyDataMap = {};

/**
 * Map every collection in a content config to the type of its entry data:
 *
 * ```ts
 * declare module 'astro:content' {
 *   type ContentConfig = typeof import('../src/content.config.js');
 *   interface DataMap extends InferData<ContentConfig> {}
 * }
 * ```
 *
 * This is not how `astro sync` writes `DataMap`, because the whole map cannot be resolved
 * without resolving the config, and the config resolves `reference()`, which needs the
 * collection names. It writes {@link InferCollectionData} per collection instead, so the names
 * are declared up front and only the data behind each one is inferred. Use this when writing
 * a `DataMap` by hand for a config that does not call `reference()`.
 */
export type InferData<TConfig> = [TConfig] extends [never]
	? EmptyDataMap
	: TConfig extends { collections: infer TCollections }
		? { [K in keyof TCollections & string]: InferSchemaData<TCollections[K]> }
		: EmptyDataMap;

type LiveLoaderOf<TCollection> = TCollection extends { loader: infer L } ? L : never;

type InferLiveLoaderTypes<TLoader> =
	TLoader extends LiveLoader<infer TData, infer TEntryFilter, infer TCollectionFilter, infer TError>
		? {
				data: TData;
				entryFilter: TEntryFilter;
				collectionFilter: TCollectionFilter;
				error: TError;
			}
		: { data: never; entryFilter: never; collectionFilter: never; error: never };

/**
 * Everything a live collection is typed by: the data its loader returns (or its schema
 * produces, when it has one) plus the filters and error type the loader accepts.
 */
export type InferLiveCollectionTypes<TCollection> = {
	data: HasSchema<CollectionSchema<TCollection>> extends true
		? InferSchemaOutput<Defined<CollectionSchema<TCollection>>>
		: InferLiveLoaderTypes<LiveLoaderOf<TCollection>>['data'];
	entryFilter: InferLiveLoaderTypes<LiveLoaderOf<TCollection>>['entryFilter'];
	collectionFilter: InferLiveLoaderTypes<LiveLoaderOf<TCollection>>['collectionFilter'];
	error: InferLiveLoaderTypes<LiveLoaderOf<TCollection>>['error'];
};

/** The `InferData` of live collections: every collection in a live config, fully typed. */
export type InferLiveData<TConfig> = [TConfig] extends [never]
	? EmptyDataMap
	: TConfig extends { collections: infer TCollections }
		? { [K in keyof TCollections & string]: InferLiveCollectionTypes<TCollections[K]> }
		: EmptyDataMap;

declare module 'astro:content' {
	export { z } from 'astro/zod';

	// This needs to be in sync with ImageMetadata
	export type ImageFunction = () => import('astro/zod').ZodObject<{
		src: import('astro/zod').ZodString;
		width: import('astro/zod').ZodNumber;
		height: import('astro/zod').ZodNumber;
		format: import('astro/zod').ZodUnion<
			[
				import('astro/zod').ZodLiteral<'png'>,
				import('astro/zod').ZodLiteral<'jpg'>,
				import('astro/zod').ZodLiteral<'jpeg'>,
				import('astro/zod').ZodLiteral<'tiff'>,
				import('astro/zod').ZodLiteral<'webp'>,
				import('astro/zod').ZodLiteral<'gif'>,
				import('astro/zod').ZodLiteral<'svg'>,
				import('astro/zod').ZodLiteral<'avif'>,
			]
		>;
	}>;

	export interface DataStore {
		get: (key: string) => any;
		entries: () => IterableIterator<[id: string, any]>;
		set: (key: string, value: any) => void;
		delete: (key: string) => void;
		clear: () => void;
		has: (key: string) => boolean;
	}
	export interface MetaStore {
		get: (key: string) => string | undefined;
		set: (key: string, value: string) => void;
		has: (key: string) => boolean;
	}

	export interface ParseDataOptions {
		/** The ID of the entry. Unique per collection */
		id: string;
		/** The raw, unvalidated data of the entry */
		data: Record<string, unknown>;
		/** An optional file path, where the entry represents a local file */
		filePath?: string;
	}
	export interface LoaderContext {
		collection: string;
		/** A database abstraction to store the actual data */
		store: DataStore;
		/**  A simple KV store, designed for things like sync tokens */
		meta: MetaStore;
		logger: import('astro').AstroIntegrationLogger;
		settings: import('astro').AstroSettings;
		/** Validates and parses the data according to the schema */
		parseData<T extends Record<string, unknown> = Record<string, unknown>>(
			props: ParseDataOptions
		): T;
	}
	export interface Loader<S extends BaseSchema = BaseSchema> {
		/** Unique name of the loader, e.g. the npm package name */
		name: string;
		/** Do the actual loading of the data */
		load: (context: LoaderContext) => Promise<void>;
		/** Optionally, define the schema of the data. Will be overridden by user-defined schema */
		schema?: S | Promise<S> | (() => S | Promise<S>);
		render?: (entry: any) => any;
	}

	export function file(filePath: string): Loader;

	type BaseSchemaWithoutEffects =
		| import('astro/zod').AnyZodObject
		| import('astro/zod').ZodUnion<[BaseSchemaWithoutEffects, ...BaseSchemaWithoutEffects[]]>
		| import('astro/zod').ZodDiscriminatedUnion<string, import('astro/zod').AnyZodObject[]>
		| import('astro/zod').ZodIntersection<BaseSchemaWithoutEffects, BaseSchemaWithoutEffects>;

	export type BaseSchema =
		| BaseSchemaWithoutEffects
		| import('astro/zod').ZodEffects<BaseSchemaWithoutEffects>;

	export type SchemaContext = { image: ImageFunction };

	type ContentCollectionV2Config<S extends BaseSchema> = {
		type: 'experimental_data';
		schema?: S | ((context: SchemaContext) => S);
		loader: Loader<S>;
	};

	type DataCollectionConfig<S extends BaseSchema> = {
		type: 'data';
		schema?: S | ((context: SchemaContext) => S);
	};

	type ContentCollectionConfig<S extends BaseSchema> = {
		type?: 'content';
		schema?: S | ((context: SchemaContext) => S);
	};

	export type CollectionConfig<S extends BaseSchema> =
		| ContentCollectionConfig<S>
		| DataCollectionConfig<S>
		| ContentCollectionV2Config<S>;

	export function defineCollection<S extends BaseSchema>(
		input: CollectionConfig<S>
	): CollectionConfig<S>;

	/** Run `astro sync` to generate high fidelity types */
	export const getEntryBySlug: (...args: any[]) => any;
	/** Run `astro sync` to generate high fidelity types */
	export const getDataEntryById: (...args: any[]) => any;
	/** Run `astro sync` to generate high fidelity types */
	export const getCollection: (...args: any[]) => any;
	/** Run `astro sync` to generate high fidelity types */
	export const getEntry: (...args: any[]) => any;
	/** Run `astro sync` to generate high fidelity types */
	export const getEntries: (...args: any[]) => any;
	/** Run `astro sync` to generate high fidelity types */
	export const reference: (...args: any[]) => any;
	/** Run `astro sync` to generate high fidelity types */
	export type CollectionKey = any;
	/** Run `astro sync` to generate high fidelity types */
	export type CollectionEntry<C> = any;
	/** Run `astro sync` to generate high fidelity types */
	export type ContentCollectionKey = any;
	/** Run `astro sync` to generate high fidelity types */
	export type DataCollectionKey = any;
	/** Run `astro sync` to generate high fidelity types */
	export type ContentConfig = any;
}

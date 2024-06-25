import type { ScopedDataStore } from '../src/content/data-store.js';
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

	type BaseSchemaWithoutEffects =
		| import('astro/zod').AnyZodObject
		| import('astro/zod').ZodUnion<[BaseSchemaWithoutEffects, ...BaseSchemaWithoutEffects[]]>
		| import('astro/zod').ZodDiscriminatedUnion<string, import('astro/zod').AnyZodObject[]>
		| import('astro/zod').ZodIntersection<BaseSchemaWithoutEffects, BaseSchemaWithoutEffects>;

	export type BaseSchema =
		| BaseSchemaWithoutEffects
		| import('astro/zod').ZodEffects<BaseSchemaWithoutEffects>;

	export type SchemaContext = { image: ImageFunction };

	export interface LoaderContext {
		collection: string;
		// A database abstraction to store the actual data
		store: ScopedDataStore;
		// A simple KV store, designed for things like sync tokens
		// Persisted to disk
		cache: any;
	}

	export interface Loader<S extends BaseSchema = BaseSchema> {
		// Name of the loader, e.g. the npm package name
		name: string;
		// Do the actual loading of the data
		load: (context: LoaderContext) => Promise<void>;
		// Allow a loader to define its own schema
		schema?: S | Promise<S> | ((context: SchemaContext) => S | Promise<S>);
		// Render content from the store
		render?: (entry: any) => any;
	}

	type ContentCollectionV2Config<S extends BaseSchema> = {
		type: 'experimental_data';
		name: string;
		schema?: undefined;
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

import { defineCollection as _defineCollection } from '../content/runtime.js';
import { z } from 'zod';

export { z };

// This needs to be in sync with ImageMetadata
export type ImageFunction = () => z.ZodObject<{
	src: z.ZodString;
	width: z.ZodNumber;
	height: z.ZodNumber;
	format: z.ZodUnion<
		[
			z.ZodLiteral<'png'>,
			z.ZodLiteral<'jpg'>,
			z.ZodLiteral<'jpeg'>,
			z.ZodLiteral<'tiff'>,
			z.ZodLiteral<'webp'>,
			z.ZodLiteral<'gif'>,
			z.ZodLiteral<'svg'>,
			z.ZodLiteral<'avif'>,
		]
	>;
}>;

type BaseSchemaWithoutEffects =
	| z.AnyZodObject
	| z.ZodUnion<[BaseSchemaWithoutEffects, ...BaseSchemaWithoutEffects[]]>
	| z.ZodDiscriminatedUnion<string, z.AnyZodObject[]>
	| z.ZodIntersection<BaseSchemaWithoutEffects, BaseSchemaWithoutEffects>;

type BaseSchema = BaseSchemaWithoutEffects | z.ZodEffects<BaseSchemaWithoutEffects>;

export type SchemaContext = { image: ImageFunction };

type DataCollectionConfig<S extends BaseSchema> = {
	type: 'data';
	schema?: S | ((context: SchemaContext) => S);
};

type ContentCollectionConfig<S extends BaseSchema> = {
	type?: 'content';
	schema?: S | ((context: SchemaContext) => S);
};

type CollectionConfig<S extends BaseSchema> = ContentCollectionConfig<S> | DataCollectionConfig<S>;

export function defineCollection<S extends BaseSchema>(
	input: CollectionConfig<S>
): CollectionConfig<S> {
	return _defineCollection(input);
}

const noop: (...args: any[]) => any = () => {};
/** Run `astro sync` to generate high fidelity types */
export const getEntryBySlug = noop;
/** Run `astro sync` to generate high fidelity types */
export const getDataEntryById = noop;
/** Run `astro sync` to generate high fidelity types */
export const getCollection = noop;
/** Run `astro sync` to generate high fidelity types */
export const getEntry = noop;
/** Run `astro sync` to generate high fidelity types */
export const getEntries = noop;
/** Run `astro sync` to generate high fidelity types */
export const reference = noop;
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

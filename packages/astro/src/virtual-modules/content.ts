import { defineCollection as _defineCollection } from '../content/runtime.js';
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

// @ts-ignore complains about circular dependency but used to work in the types template
type BaseSchemaWithoutEffects =
	| import('astro/zod').AnyZodObject
	| import('astro/zod').ZodUnion<[BaseSchemaWithoutEffects, ...BaseSchemaWithoutEffects[]]>
	| import('astro/zod').ZodDiscriminatedUnion<string, import('astro/zod').AnyZodObject[]>
	| import('astro/zod').ZodIntersection<BaseSchemaWithoutEffects, BaseSchemaWithoutEffects>;

type BaseSchema =
	| BaseSchemaWithoutEffects
	| import('astro/zod').ZodEffects<BaseSchemaWithoutEffects>;

export type SchemaContext = { image: ImageFunction };

type DataCollectionConfig<S extends BaseSchema> = {
	type: 'data';
	schema?: S | ((context: SchemaContext) => S);
};

type ContentCollectionConfig<S extends BaseSchema> = {
	type?: 'content';
	schema?: S | ((context: SchemaContext) => S);
};

type CollectionConfig<S> = ContentCollectionConfig<S> | DataCollectionConfig<S>;

export function defineCollection<S extends BaseSchema>(
	input: CollectionConfig<S>
): CollectionConfig<S> {
	return _defineCollection(input);
}

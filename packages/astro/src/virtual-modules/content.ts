import { defineCollection as _defineCollection } from '../content/runtime.js';
export { z } from 'zod';

// This needs to be in sync with ImageMetadata
export type ImageFunction = () => import('zod').ZodObject<{
	src: import('zod').ZodString;
	width: import('zod').ZodNumber;
	height: import('zod').ZodNumber;
	format: import('zod').ZodUnion<
		[
			import('zod').ZodLiteral<'png'>,
			import('zod').ZodLiteral<'jpg'>,
			import('zod').ZodLiteral<'jpeg'>,
			import('zod').ZodLiteral<'tiff'>,
			import('zod').ZodLiteral<'webp'>,
			import('zod').ZodLiteral<'gif'>,
			import('zod').ZodLiteral<'svg'>,
			import('zod').ZodLiteral<'avif'>,
		]
	>;
}>;

// @ts-ignore complains about circular dependency but used to work in the types template
type BaseSchemaWithoutEffects =
	| import('zod').AnyZodObject
	| import('zod').ZodUnion<[BaseSchemaWithoutEffects, ...BaseSchemaWithoutEffects[]]>
	| import('zod').ZodDiscriminatedUnion<string, import('zod').AnyZodObject[]>
	| import('zod').ZodIntersection<BaseSchemaWithoutEffects, BaseSchemaWithoutEffects>;

type BaseSchema =
	| BaseSchemaWithoutEffects
	| import('zod').ZodEffects<BaseSchemaWithoutEffects>;

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

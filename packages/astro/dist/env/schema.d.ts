import * as z from 'zod/v4';
declare const StringSchema: z.ZodObject<
	{
		type: z.ZodLiteral<'string'>;
		optional: z.ZodOptional<z.ZodBoolean>;
		default: z.ZodOptional<z.ZodString>;
		max: z.ZodOptional<z.ZodNumber>;
		min: z.ZodOptional<z.ZodNumber>;
		length: z.ZodOptional<z.ZodNumber>;
		url: z.ZodOptional<z.ZodBoolean>;
		includes: z.ZodOptional<z.ZodString>;
		startsWith: z.ZodOptional<z.ZodString>;
		endsWith: z.ZodOptional<z.ZodString>;
	},
	z.core.$strip
>;
export type StringSchema = z.infer<typeof StringSchema>;
declare const NumberSchema: z.ZodObject<
	{
		type: z.ZodLiteral<'number'>;
		optional: z.ZodOptional<z.ZodBoolean>;
		default: z.ZodOptional<z.ZodNumber>;
		gt: z.ZodOptional<z.ZodNumber>;
		min: z.ZodOptional<z.ZodNumber>;
		lt: z.ZodOptional<z.ZodNumber>;
		max: z.ZodOptional<z.ZodNumber>;
		int: z.ZodOptional<z.ZodBoolean>;
	},
	z.core.$strip
>;
export type NumberSchema = z.infer<typeof NumberSchema>;
declare const BooleanSchema: z.ZodObject<
	{
		type: z.ZodLiteral<'boolean'>;
		optional: z.ZodOptional<z.ZodBoolean>;
		default: z.ZodOptional<z.ZodBoolean>;
	},
	z.core.$strip
>;
declare const EnumSchema: z.ZodObject<
	{
		type: z.ZodLiteral<'enum'>;
		values: z.ZodArray<z.ZodString>;
		optional: z.ZodOptional<z.ZodBoolean>;
		default: z.ZodOptional<z.ZodString>;
	},
	z.core.$strip
>;
export type EnumSchema = z.infer<typeof EnumSchema>;
declare const EnvFieldType: z.ZodUnion<
	readonly [
		z.ZodObject<
			{
				type: z.ZodLiteral<'string'>;
				optional: z.ZodOptional<z.ZodBoolean>;
				default: z.ZodOptional<z.ZodString>;
				max: z.ZodOptional<z.ZodNumber>;
				min: z.ZodOptional<z.ZodNumber>;
				length: z.ZodOptional<z.ZodNumber>;
				url: z.ZodOptional<z.ZodBoolean>;
				includes: z.ZodOptional<z.ZodString>;
				startsWith: z.ZodOptional<z.ZodString>;
				endsWith: z.ZodOptional<z.ZodString>;
			},
			z.core.$strip
		>,
		z.ZodObject<
			{
				type: z.ZodLiteral<'number'>;
				optional: z.ZodOptional<z.ZodBoolean>;
				default: z.ZodOptional<z.ZodNumber>;
				gt: z.ZodOptional<z.ZodNumber>;
				min: z.ZodOptional<z.ZodNumber>;
				lt: z.ZodOptional<z.ZodNumber>;
				max: z.ZodOptional<z.ZodNumber>;
				int: z.ZodOptional<z.ZodBoolean>;
			},
			z.core.$strip
		>,
		z.ZodObject<
			{
				type: z.ZodLiteral<'boolean'>;
				optional: z.ZodOptional<z.ZodBoolean>;
				default: z.ZodOptional<z.ZodBoolean>;
			},
			z.core.$strip
		>,
		z.ZodObject<
			{
				type: z.ZodLiteral<'enum'>;
				values: z.ZodArray<z.ZodString>;
				optional: z.ZodOptional<z.ZodBoolean>;
				default: z.ZodOptional<z.ZodString>;
			},
			z.core.$strip
		>,
	]
>;
export type EnvFieldType = z.infer<typeof EnvFieldType>;
declare const EnvFieldMetadata: z.ZodCustom<
	| {
			context: 'client';
			access: 'public';
	  }
	| {
			context: 'server';
			access: 'public';
	  }
	| {
			context: 'server';
			access: 'secret';
	  },
	| {
			context: 'client';
			access: 'public';
	  }
	| {
			context: 'server';
			access: 'public';
	  }
	| {
			context: 'server';
			access: 'secret';
	  }
>;
export declare const EnvSchema: z.ZodRecord<
	z.ZodString,
	z.ZodIntersection<
		z.ZodCustom<
			| {
					context: 'client';
					access: 'public';
			  }
			| {
					context: 'server';
					access: 'public';
			  }
			| {
					context: 'server';
					access: 'secret';
			  },
			| {
					context: 'client';
					access: 'public';
			  }
			| {
					context: 'server';
					access: 'public';
			  }
			| {
					context: 'server';
					access: 'secret';
			  }
		>,
		z.ZodUnion<
			readonly [
				z.ZodObject<
					{
						type: z.ZodLiteral<'string'>;
						optional: z.ZodOptional<z.ZodBoolean>;
						default: z.ZodOptional<z.ZodString>;
						max: z.ZodOptional<z.ZodNumber>;
						min: z.ZodOptional<z.ZodNumber>;
						length: z.ZodOptional<z.ZodNumber>;
						url: z.ZodOptional<z.ZodBoolean>;
						includes: z.ZodOptional<z.ZodString>;
						startsWith: z.ZodOptional<z.ZodString>;
						endsWith: z.ZodOptional<z.ZodString>;
					},
					z.core.$strip
				>,
				z.ZodObject<
					{
						type: z.ZodLiteral<'number'>;
						optional: z.ZodOptional<z.ZodBoolean>;
						default: z.ZodOptional<z.ZodNumber>;
						gt: z.ZodOptional<z.ZodNumber>;
						min: z.ZodOptional<z.ZodNumber>;
						lt: z.ZodOptional<z.ZodNumber>;
						max: z.ZodOptional<z.ZodNumber>;
						int: z.ZodOptional<z.ZodBoolean>;
					},
					z.core.$strip
				>,
				z.ZodObject<
					{
						type: z.ZodLiteral<'boolean'>;
						optional: z.ZodOptional<z.ZodBoolean>;
						default: z.ZodOptional<z.ZodBoolean>;
					},
					z.core.$strip
				>,
				z.ZodObject<
					{
						type: z.ZodLiteral<'enum'>;
						values: z.ZodArray<z.ZodString>;
						optional: z.ZodOptional<z.ZodBoolean>;
						default: z.ZodOptional<z.ZodString>;
					},
					z.core.$strip
				>,
			]
		>
	>
>;
type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};
export type EnvSchema = z.infer<typeof EnvSchema>;
type _Field<T extends z.ZodType> = Prettify<z.infer<typeof EnvFieldMetadata> & z.infer<T>>;
type _FieldInput<T extends z.ZodType, TKey extends string = 'type'> = Prettify<
	z.infer<typeof EnvFieldMetadata> & Omit<z.infer<T>, TKey>
>;
export type StringField = _Field<typeof StringSchema>;
export type StringFieldInput = _FieldInput<typeof StringSchema>;
export type NumberField = _Field<typeof NumberSchema>;
export type NumberFieldInput = _FieldInput<typeof NumberSchema>;
export type BooleanField = _Field<typeof BooleanSchema>;
export type BooleanFieldInput = _FieldInput<typeof BooleanSchema>;
export type EnumField = _Field<typeof EnumSchema>;
export type EnumFieldInput<T extends string> = Prettify<
	_FieldInput<typeof EnumSchema, 'type' | 'values' | 'default'> & {
		values: Array<T>;
		default?: NoInfer<T> | undefined;
	}
>;
export {};

import { z } from 'zod';

const StringSchema = z.object({
	type: z.literal('string'),
	optional: z.boolean().optional(),
	default: z.string().optional(),
});
const NumberSchema = z.object({
	type: z.literal('number'),
	optional: z.boolean().optional(),
	default: z.number().optional(),
});
const BooleanSchema = z.object({
	type: z.literal('boolean'),
	optional: z.boolean().optional(),
	default: z.boolean().optional(),
});

const EnvFieldType = z.discriminatedUnion('type', [StringSchema, NumberSchema, BooleanSchema]);
export type EnvFieldType = z.infer<typeof EnvFieldType>

const PublicClientEnvFieldMetadata = z.object({
	context: z.literal('client'),
	access: z.literal('public'),
});
const PublicServerEnvFieldMetadata = z.object({
	context: z.literal('server'),
	access: z.literal('public'),
});
const SecretServerEnvFieldMetadata = z.object({
	context: z.literal('server'),
	access: z.literal('secret'),
});

const KEY_REGEX = /^[A-Z_]+$/;

export const EnvSchema = z.union([
	z.record(
		z.custom<`PUBLIC_${string}`>(
			(val) => z.string().regex(KEY_REGEX).startsWith('PUBLIC_').safeParse(val).success
		),
		z.intersection(PublicClientEnvFieldMetadata, EnvFieldType)
	),
	z.record(
		z.string().regex(KEY_REGEX),
		z.intersection(
			z.union([PublicServerEnvFieldMetadata, SecretServerEnvFieldMetadata]),
			EnvFieldType
		)
	),
]);

export type EnvSchema = z.infer<typeof EnvSchema>;

const StringField = z.intersection(
	z.union([
		PublicClientEnvFieldMetadata,
		PublicServerEnvFieldMetadata,
		SecretServerEnvFieldMetadata,
	]),
	StringSchema
);
export type StringField = z.infer<typeof StringField>;
export const StringFieldInput = z.intersection(
	z.union([
		PublicClientEnvFieldMetadata,
		PublicServerEnvFieldMetadata,
		SecretServerEnvFieldMetadata,
	]),
	StringSchema.omit({ type: true })
);
export type StringFieldInput = z.infer<typeof StringFieldInput>;

const NumberField = z.intersection(
	z.union([
		PublicClientEnvFieldMetadata,
		PublicServerEnvFieldMetadata,
		SecretServerEnvFieldMetadata,
	]),
	NumberSchema
);
export type NumberField = z.infer<typeof NumberField>;
export const NumberFieldInput = z.intersection(
	z.union([
		PublicClientEnvFieldMetadata,
		PublicServerEnvFieldMetadata,
		SecretServerEnvFieldMetadata,
	]),
	NumberSchema.omit({ type: true })
);
export type NumberFieldInput = z.infer<typeof NumberFieldInput>;

const BooleanField = z.intersection(
	z.union([
		PublicClientEnvFieldMetadata,
		PublicServerEnvFieldMetadata,
		SecretServerEnvFieldMetadata,
	]),
	BooleanSchema
);
export type BooleanField = z.infer<typeof BooleanField>;
export const BooleanFieldInput = z.intersection(
	z.union([
		PublicClientEnvFieldMetadata,
		PublicServerEnvFieldMetadata,
		SecretServerEnvFieldMetadata,
	]),
	BooleanSchema.omit({ type: true })
);
export type BooleanFieldInput = z.infer<typeof BooleanFieldInput>;

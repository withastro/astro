import { z } from 'zod';
import { PUBLIC_PREFIX } from './constants.js';

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
export type EnvFieldType = z.infer<typeof EnvFieldType>;

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

export const EnvSchema = z
	.record(
		z.string().regex(KEY_REGEX, {
			message: 'A valid variable name can only contain uppercase letters and underscores.',
		}),
		z.intersection(
			z.union([
				PublicClientEnvFieldMetadata,
				PublicServerEnvFieldMetadata,
				SecretServerEnvFieldMetadata,
			]),
			EnvFieldType
		)
	)
	.superRefine((schema, ctx) => {
		for (const [key, value] of Object.entries(schema)) {
			if (key.startsWith(PUBLIC_PREFIX) && value.access !== 'public') {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `An environment variable whose name is prefixed by "${PUBLIC_PREFIX}" must be public.`,
				});
			}
			if (value.access === 'public' && !key.startsWith(PUBLIC_PREFIX)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `An environment variable that is public must have a name prefixed by "${PUBLIC_PREFIX}".`,
				});
			}
		}
	});

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

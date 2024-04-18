import { z } from 'zod';

const StringField = z.object({
	type: z.literal('string'),
	optional: z.boolean().optional(),
	default: z.string().optional(),
});
const NumberField = z.object({
	type: z.literal('number'),
	optional: z.boolean().optional(),
	default: z.number().optional(),
});
const BooleanField = z.object({
	type: z.literal('boolean'),
	optional: z.boolean().optional(),
	default: z.boolean().optional(),
});

const EnvFieldType = z.discriminatedUnion('type', [StringField, NumberField, BooleanField]);

const PublicStaticEnvFieldMetadata = z.object({
	scope: z.literal('static'),
	access: z.literal('public'),
});
const PrivateStaticEnvFieldMetadata = z.object({
	scope: z.literal('static'),
	access: z.literal('private'),
});
const PrivateDynamicEnvFieldMetadata = z.object({
	scope: z.literal('dynamic'),
	access: z.literal('private'),
});

export const EnvSchema = z.union([
	z.record(
		z.custom<`PUBLIC_${string}`>((val) => z.string().startsWith('PUBLIC_').safeParse(val).success),
		z.intersection(PublicStaticEnvFieldMetadata, EnvFieldType)
	),
	z.record(
		z.string(),
		z.intersection(
			z.union([PrivateStaticEnvFieldMetadata, PrivateDynamicEnvFieldMetadata]),
			EnvFieldType
		)
	),
]);

export type EnvSchema = z.infer<typeof EnvSchema>
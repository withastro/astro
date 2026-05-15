import * as z from 'zod/v4';
const StringSchema = z.object({
	type: z.literal('string'),
	optional: z.boolean().optional(),
	default: z.string().optional(),
	max: z.number().optional(),
	min: z.number().min(0).optional(),
	length: z.number().optional(),
	url: z.boolean().optional(),
	includes: z.string().optional(),
	startsWith: z.string().optional(),
	endsWith: z.string().optional(),
});
const NumberSchema = z.object({
	type: z.literal('number'),
	optional: z.boolean().optional(),
	default: z.number().optional(),
	gt: z.number().optional(),
	min: z.number().optional(),
	lt: z.number().optional(),
	max: z.number().optional(),
	int: z.boolean().optional(),
});
const BooleanSchema = z.object({
	type: z.literal('boolean'),
	optional: z.boolean().optional(),
	default: z.boolean().optional(),
});
const EnumSchema = z.object({
	type: z.literal('enum'),
	values: z.array(
		// We use "'" for codegen so it can't be passed here
		z.string().refine((v) => !v.includes("'"), {
			message: `The "'" character can't be used as an enum value`,
		}),
	),
	optional: z.boolean().optional(),
	default: z.string().optional(),
});
const EnvFieldType = z.union([
	StringSchema,
	NumberSchema,
	BooleanSchema,
	EnumSchema.superRefine((schema, ctx) => {
		if (schema.default) {
			if (!schema.values.includes(schema.default)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `The default value "${schema.default}" must be one of the specified values: ${schema.values.join(', ')}.`,
				});
			}
		}
	}),
]);
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
const _EnvFieldMetadata = z.union([
	PublicClientEnvFieldMetadata,
	PublicServerEnvFieldMetadata,
	SecretServerEnvFieldMetadata,
]);
const EnvFieldMetadata = z.custom().superRefine((data, ctx) => {
	const result = _EnvFieldMetadata.safeParse(data);
	if (result.success) {
		return;
	}
	for (const issue of result.error.issues) {
		if (issue.code === z.ZodIssueCode.invalid_union) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `**Invalid combination** of "access" and "context" options:
  Secret client variables are not supported. Please review the configuration.
  Learn more at https://docs.astro.build/en/guides/environment-variables/#variable-types`,
				path: ['context', 'access'],
			});
		} else {
			ctx.addIssue({
				...issue,
				code: 'custom',
			});
		}
	}
});
const EnvSchemaKey = z
	.string()
	.min(1)
	.refine(([firstChar]) => isNaN(Number.parseInt(firstChar)), {
		message: 'A valid variable name cannot start with a number.',
	})
	.refine((str) => /^[A-Z0-9_]+$/.test(str), {
		message: 'A valid variable name can only contain uppercase letters, numbers and underscores.',
	});
const EnvSchema = z.record(EnvSchemaKey, z.intersection(EnvFieldMetadata, EnvFieldType));
export { EnvSchema };

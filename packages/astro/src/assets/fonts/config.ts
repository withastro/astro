import { z } from 'zod';
import { LOCAL_PROVIDER_NAME } from './constants.js';

export const weightSchema = z.union([z.string(), z.number()]);
export const styleSchema = z.enum(['normal', 'italic', 'oblique']);
export const displaySchema = z.enum(['auto', 'block', 'swap', 'fallback', 'optional']);

const familyPropertiesSchema = z.object({
	weight: weightSchema.optional(),
	style: styleSchema.optional(),
	display: displaySchema.optional(),
	stretch: z.string().optional(),
	featureSettings: z.string().optional(),
	variationSettings: z.string().optional(),
	unicodeRange: z.array(z.string()).nonempty().optional(),
});

const fallbacksSchema = z.object({
	fallbacks: z.array(z.string()).optional(),
	optimizedFallbacks: z.boolean().optional(),
});

const requiredFamilyAttributesSchema = z.object({
	name: z.string(),
	cssVariable: z.string(),
});

const entrypointSchema = z.union([z.string(), z.instanceof(URL)]);

export const localFontFamilySchema = z
	.object({
		...requiredFamilyAttributesSchema.shape,
		...fallbacksSchema.shape,
		provider: z.literal(LOCAL_PROVIDER_NAME),
		variants: z
			.array(
				z
					.object({
						...familyPropertiesSchema.shape,
						src: z
							.array(
								z.union([
									entrypointSchema,
									z.object({ url: entrypointSchema, tech: z.string().optional() }).strict(),
								]),
							)
							.nonempty(),
						// TODO: find a way to support subsets (through fontkit?)
					})
					.strict(),
			)
			.nonempty(),
	})
	.strict();

export const remoteFontFamilySchema = z
	.object({
		...requiredFamilyAttributesSchema.shape,
		...fallbacksSchema.shape,
		...familyPropertiesSchema.omit({
			weight: true,
			style: true,
		}).shape,
		provider: z
			.object({
				entrypoint: entrypointSchema,
				config: z.record(z.string(), z.any()).optional(),
			})
			.strict(),
		weights: z.array(weightSchema).nonempty().optional(),
		styles: z.array(styleSchema).nonempty().optional(),
		subsets: z.array(z.string()).nonempty().optional(),
	})
	.strict();

import { z } from 'zod';
import { LOCAL_PROVIDER_NAME } from './constants.js';

// TODO: jsdoc for everything, most of those end up in the public AstroConfig type

const weightSchema = z.union([z.string(), z.number()]);
const styleSchema = z.enum(['normal', 'italic', 'oblique']);

const familyPropertiesSchema = z.object({
	weight: weightSchema,
	style: styleSchema,
	display: z.enum(['auto', 'block', 'swap', 'fallback', 'optional']).optional(),
	unicodeRange: z.array(z.string()).nonempty().optional(),
	stretch: z.string().optional(),
	featureSettings: z.string().optional(),
	variationSettings: z.string().optional(),
});

const fallbacksSchema = z.object({
	fallbacks: z.array(z.string()).nonempty().optional(),
	automaticFallback: z.boolean().optional(),
});

export const requiredFamilyAttributesSchema = z.object({
	name: z.string(),
	cssVariable: z.string(),
});

const entrypointSchema = z.union([z.string(), z.instanceof(URL)]);

export const fontProviderSchema = z
	.object({
		entrypoint: entrypointSchema,
		config: z.record(z.string(), z.any()).optional(),
	})
	.strict();

export const localFontFamilySchema = requiredFamilyAttributesSchema
	.merge(fallbacksSchema)
	.merge(
		z.object({
			provider: z.literal(LOCAL_PROVIDER_NAME),
			variants: z
				.array(
					familyPropertiesSchema.merge(
						z
							.object({
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
					),
				)
				.nonempty(),
		}),
	)
	.strict();

export const remoteFontFamilySchema = requiredFamilyAttributesSchema
	.merge(
		familyPropertiesSchema.omit({
			weight: true,
			style: true,
		}),
	)
	.merge(fallbacksSchema)
	.merge(
		z.object({
			provider: fontProviderSchema,
			weights: z.array(weightSchema).nonempty().optional(),
			styles: z.array(styleSchema).nonempty().optional(),
			subsets: z.array(z.string()).nonempty().optional(),
		}),
	)
	.strict();

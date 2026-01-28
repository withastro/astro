import { z } from 'zod';
import { FONT_TYPES } from './constants.js';
import type { FontProvider } from './types.js';

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

const _fontProviderSchema = z
	.object({
		name: z.string(),
		config: z.record(z.string(), z.any()).optional(),
		init: z.custom<FontProvider['init']>((v) => typeof v === 'function').optional(),
		resolveFont: z.custom<FontProvider['resolveFont']>((v) => typeof v === 'function'),
		listFonts: z.custom<FontProvider['listFonts']>((v) => typeof v === 'function').optional(),
	})
	.strict();

// Using z.object directly makes zod remap the input, preventing
// the usage of class instances. Instead, we check if it matches
// the right shape and pass the original
export const fontProviderSchema = z.custom<FontProvider>((v) => {
	return _fontProviderSchema.safeParse(v).success;
}, 'Invalid FontProvider object');

export const fontFamilySchema = z
	.object({
		...requiredFamilyAttributesSchema.shape,
		...fallbacksSchema.shape,
		...familyPropertiesSchema.omit({
			weight: true,
			style: true,
		}).shape,
		provider: fontProviderSchema,
		options: z.record(z.string(), z.any()).optional(),
		weights: z.array(weightSchema).nonempty().optional(),
		styles: z.array(styleSchema).nonempty().optional(),
		subsets: z.array(z.string()).nonempty().optional(),
		formats: z.array(z.enum(FONT_TYPES)).nonempty().optional(),
	})
	.strict();

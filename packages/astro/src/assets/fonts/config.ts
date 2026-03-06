import * as z from 'zod/v4';
import { FONT_TYPES } from './constants.js';
import type { FontProvider } from './types.js';

export const WeightSchema = z.union([z.string(), z.number()]);
export const StyleSchema = z.enum(['normal', 'italic', 'oblique']);
export const DisplaySchema = z.enum(['auto', 'block', 'swap', 'fallback', 'optional']);
const FormatSchema = z.enum(FONT_TYPES);

const _FontProviderSchema = z.strictObject({
	name: z.string(),
	config: z.record(z.string(), z.any()).optional(),
	init: z.custom<FontProvider['init']>((v) => typeof v === 'function').optional(),
	resolveFont: z.custom<FontProvider['resolveFont']>((v) => typeof v === 'function'),
	listFonts: z.custom<FontProvider['listFonts']>((v) => typeof v === 'function').optional(),
});

// Using z.object directly makes zod remap the input, preventing
// the usage of class instances. Instead, we check if it matches
// the right shape and pass the original
export const FontProviderSchema = z.custom<FontProvider>((v) => {
	return _FontProviderSchema.safeParse(v).success;
}, 'Invalid FontProvider object');

export const FontFamilySchema = z
	.object({
		name: z.string(),
		cssVariable: z.string(),
		provider: FontProviderSchema,
		weights: z.tuple([WeightSchema], WeightSchema).optional(),
		styles: z.tuple([StyleSchema], StyleSchema).optional(),
		subsets: z.tuple([z.string()], z.string()).optional(),
		formats: z.tuple([FormatSchema], FormatSchema).optional(),
		fallbacks: z.array(z.string()).optional(),
		optimizedFallbacks: z.boolean().optional(),
		display: DisplaySchema.optional(),
		stretch: z.string().optional(),
		featureSettings: z.string().optional(),
		variationSettings: z.string().optional(),
		unicodeRange: z.tuple([z.string()], z.string()).optional(),
		options: z.record(z.string(), z.any()).optional(),
	})
	.strict();

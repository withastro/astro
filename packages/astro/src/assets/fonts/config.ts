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

// Known built-in provider names for better error messages
const KNOWN_PROVIDER_NAMES = [
	'adobe',
	'bunny',
	'fontshare',
	'fontsource',
	'google',
	'googleicons',
	'local',
];

// Using z.object directly makes zod remap the input, preventing
// the usage of class instances. Instead, we check if it matches
// the right shape and pass the original
export const FontProviderSchema: z.ZodType<FontProvider> = z.any().superRefine((v, ctx) => {
	if (_FontProviderSchema.safeParse(v).success) return;
	if (typeof v === 'string') {
		const suggestion = KNOWN_PROVIDER_NAMES.includes(v)
			? `\`fontProviders.${v}()\``
			: `a \`fontProviders\` function, e.g. \`fontProviders.google()\``;
		ctx.addIssue({
			code: 'custom',
			message: `Invalid \`provider\` value. Received the string \`"${v}"\` but expected a \`FontProvider\` object. Use ${suggestion} from \`"astro/config"\` instead. See https://docs.astro.build/en/reference/configuration-reference/#fonts for more information.`,
		});
	} else {
		ctx.addIssue({
			code: 'custom',
			message: `Invalid \`provider\` value. Expected a \`FontProvider\` object, e.g. \`fontProviders.google()\` from \`"astro/config"\`. See https://docs.astro.build/en/reference/configuration-reference/#fonts for more information.`,
		});
	}
});

const KNOWN_FONT_FAMILY_KEYS = new Set([
	'name',
	'cssVariable',
	'provider',
	'weights',
	'styles',
	'subsets',
	'formats',
	'fallbacks',
	'optimizedFallbacks',
	'display',
	'stretch',
	'featureSettings',
	'variationSettings',
	'unicodeRange',
	'options',
]);

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
	.catchall(z.any())
	.superRefine((val, ctx) => {
		for (const key of Object.keys(val)) {
			if (!KNOWN_FONT_FAMILY_KEYS.has(key)) {
				if (key === 'variants') {
					ctx.addIssue({
						code: 'custom',
						path: [key],
						message:
							'The `variants` option is no longer available at the top level. For remote fonts, use `weights` and `styles` instead. For local fonts, move `variants` inside the `options` property. See https://docs.astro.build/en/reference/configuration-reference/#fonts for more information.',
					});
				} else {
					ctx.addIssue({
						code: 'unrecognized_keys',
						keys: [key],
						path: [],
						message: `Unrecognized key: "${key}"`,
					});
				}
			}
		}
	});

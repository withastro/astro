import { z } from 'zod';
import { BUILTIN_PROVIDERS, GOOGLE_PROVIDER_NAME, LOCAL_PROVIDER_NAME } from './constants.js';

function dedupe<T>(arr: Array<T>): Array<T> {
	return [...new Set(arr)];
}

// TODO: jsdoc for everything, most of those end up in the public AstroConfig type

export const sharedFontOptionsSchema = z.object({
	weights: z
		.array(
			z
				.union([z.string(), z.number()])
				.transform((val) => (typeof val === 'number' ? val.toString() : val)),
		)
		.nonempty()
		.transform((arr) => dedupe(arr)),
	styles: z
		.array(z.enum(['normal', 'italic', 'oblique']))
		.nonempty()
		.transform((arr) => dedupe(arr)),
	subsets: z
		.array(z.string())
		.nonempty()
		.transform((arr) => dedupe(arr)),
	fallbacks: z
		.array(z.string())
		.nonempty()
		.transform((arr) => dedupe(arr))
		.optional(),
	automaticFallback: z.boolean().optional().default(true),
	display: z.enum(['auto', 'block', 'swap', 'fallback', 'optional']).optional(),
	unicodeRange: z.array(z.string()).nonempty().optional(),
	stretch: z.string().optional(),
	featureSettings: z.string().optional(),
	variationSettings: z.string().optional(),
});

// TODO: probably not needed anymore
// a-z A-Z 0-9 space underscore colon
export const VALID_CHAR_RE = /[\w ]/;

export const baseFamilyAttributesSchema = z.object({
	name: z.string(),
	as: z.string().optional(),
});

export const fontProviderSchema = z
	.object({
		name: z.string().superRefine((name, ctx) => {
			if (BUILTIN_PROVIDERS.includes(name as any)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `"${name}" is a reserved provider name`,
				});
			}
		}),
		entrypoint: z.union([z.string(), z.instanceof(URL)]),
		config: z.record(z.string(), z.any()).optional(),
	})
	.strict();

export const localFontFamilySchema = z
	.object({
		provider: z.literal(LOCAL_PROVIDER_NAME).optional(),
		src: z.array(
			z
				.object({
					paths: z.array(z.string()).nonempty(),
				})
				.merge(
					sharedFontOptionsSchema
						.omit({
							fallbacks: true,
							automaticFallback: true,
							// TODO: find a way to support subsets (through fontkit?)
							subsets: true,
						})
						.partial(),
				)
				.strict(),
		),
	})
	.merge(baseFamilyAttributesSchema)
	.merge(
		sharedFontOptionsSchema
			.omit({
				weights: true,
				styles: true,
				subsets: true,
			})
			.partial(),
	)
	.strict();

export const remoteFontFamilySchema = z
	.object({
		provider: z.union([z.literal(GOOGLE_PROVIDER_NAME), fontProviderSchema]).optional(),
	})
	.merge(baseFamilyAttributesSchema)
	.merge(sharedFontOptionsSchema.partial())
	.strict();

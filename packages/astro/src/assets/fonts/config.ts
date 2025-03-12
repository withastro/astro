import { z } from 'zod';

function dedupe<T>(arr: Array<T>): Array<T> {
	return [...new Set(arr)];
}

export const resolveFontOptionsSchema = z.object({
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
	display: z.enum(['auto', 'block', 'swap', 'fallback', 'optional']).optional(),
	unicodeRange: z.array(z.string()).nonempty().optional(),
	stretch: z.string().optional(),
	featureSettings: z.string().optional(),
	variationSettings: z.string().optional(),
});

export const fontFamilyAttributesSchema = z.object({
	name: z.string(),
	provider: z.string(),
	as: z.string().optional(),
});

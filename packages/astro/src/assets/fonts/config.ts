import { z } from 'zod';

function dedupe<T>(arr: Array<T>): Array<T> {
	return [...new Set(arr)];
}

export const resolveFontOptionsSchema = z.object({
	weights: z
		// TODO: support numbers
		.array(z.string())
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
});

export const fontFamilyAttributesSchema = z.object({
	name: z.string(),
	provider: z.string(),
	as: z.string().optional(),
});

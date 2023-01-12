import { z } from 'astro/zod';

export const rssSchema = z.object({
	title: z.string(),
	pubDate: z.string().transform((value) => new Date(value)),
	description: z.string().optional(),
	customData: z.string().optional(),
	draft: z.boolean().optional(),
});

export const rssOptionsSchema = z.object({
	title: z.string(),
	description: z.string(),
	site: z.string(),
	items: z.union([
		z.array(rssSchema),
		// Can also pass `import.meta.glob` result
		z.record(z.function().returns(z.promise(z.record(z.any())))),
	]),
	xmlns: z.record(z.string()).optional(),
	drafts: z.boolean().optional(),
	stylesheet: z.union([z.string(), z.boolean()]).optional(),
	customData: z.string().optional(),
});

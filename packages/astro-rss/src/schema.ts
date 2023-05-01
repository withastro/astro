import { z } from 'astro/zod';

export const rssSchema = z.object({
	title: z.string(),
	pubDate: z.union([z.string(), z.number(), z.date()]).transform((value) => new Date(value)),
	description: z.string().optional(),
	customData: z.string().optional(),
	draft: z.boolean().optional(),
	categories: z.array(z.string()).optional(),
	author: z.string().optional(),
	commentsUrl: z.string().optional(),
	source: z.object({ url: z.string().url(), title: z.string() }).optional(),
	enclosure: z
		.object({
			url: z.string(),
			length: z.number().positive().int().finite(),
			type: z.string(),
		})
		.optional(),
});

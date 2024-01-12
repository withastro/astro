import { z } from 'astro/zod';

const sharedSchema = z.object({
	pubDate: z
		.union([z.string(), z.number(), z.date()])
		.optional()
		.transform((value) => (value === undefined ? value : new Date(value)))
		.refine((value) => (value === undefined ? value : !isNaN(value.getTime()))),
	customData: z.string().optional(),
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
	link: z.string().optional(),
	content: z.string().optional(),
});

export const rssSchema = z.union([
	z
		.object({
			title: z.string(),
			description: z.string().optional(),
		})
		.merge(sharedSchema),
	z
		.object({
			title: z.string().optional(),
			description: z.string(),
		})
		.merge(sharedSchema),
]);

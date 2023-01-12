import { z } from 'astro/zod';

export const rssSchema = z.object({
	title: z.string(),
	pubDate: z.string().transform((value) => new Date(value)),
	description: z.string().optional(),
	customData: z.string().optional(),
	draft: z.boolean().optional(),
});

import { z } from 'astro/zod';

export const rssSchema = z.object({
	title: z.string(),
	pubDate: z.union([z.string(), z.number(), z.date()]).transform((value) => new Date(value)),
	description: z.string().optional(),
	customData: z.string().optional(),
	draft: z.boolean().optional(),
});

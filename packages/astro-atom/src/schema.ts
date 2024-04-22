import { z } from 'astro/zod';

export const atomSchema = z.object({
	title: z.string().optional(),
	summary: z.string().optional(),
	published: z
		.union([z.string(), z.number(), z.date()])
		.optional()
		.transform((value) => (value !== undefined ? new Date(value) : undefined))
		.refine((value) => (value ? !isNaN(value.getTime()) : true)),
	updated: z
		.union([z.string(), z.number(), z.date()])
		.optional()
		.transform((value) => (value === undefined ? value : new Date(value)))
		.refine((value) => (value === undefined ? value : !isNaN(value.getTime()))),
	customData: z.string().optional(),
	categories: z.array(z.string()).optional(),
	author: z
		.object({
			name: z.string(),
			uri: z.string().url().optional(),
			email: z.string().email().optional(),
		})
		.optional(),
	source: z.object({ url: z.string().url(), title: z.string() }).optional(),
	enclosure: z
		.object({
			url: z.string(),
			length: z.number().nonnegative().int().finite(),
			type: z.string(),
		})
		.optional(),
	link: z.string().optional(),
	content: z.string().optional(),
});

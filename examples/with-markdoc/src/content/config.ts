import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	schema: z.object({
		title: z.string(),
	}),
});

const docs = defineCollection({
	schema: z.object({
		title: z.string(),
		description: z.string(),
		i18nReady: z.boolean(),
	}),
});

export const collections = { blog, docs };

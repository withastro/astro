import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
	}),
});

const data = defineCollection({
	type: 'data',
	schema: z.object({
		name: z.string(),
	}),
});

export const collections = { blog, data };

import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string().describe("The blog post's title."),
		description: z.string(),
		tags: z.array(z.string()).optional(),
		type: z.enum(['blog']).optional(),
	}),
});

const caching = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string().describe("I will be changed"),
	}),
});

export const collections = { blog, caching };

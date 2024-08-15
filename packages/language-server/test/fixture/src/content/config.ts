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

export const collections = { blog };

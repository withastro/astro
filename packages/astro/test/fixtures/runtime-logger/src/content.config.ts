import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/blog' }),
	schema: z.object({
		title: z.string(),
	}),
});

export const collections = { blog };

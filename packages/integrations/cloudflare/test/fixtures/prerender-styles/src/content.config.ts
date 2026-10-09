import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
	loader: glob({ pattern: '**/*.mdx', base: './src/content/posts' }),
	schema: z.object({
		title: z.string(),
	}),
});

export const collections = { posts };

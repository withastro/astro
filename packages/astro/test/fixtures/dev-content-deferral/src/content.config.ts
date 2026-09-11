import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/posts' }),
	schema: z.object({
		title: z.string(),
	}),
});

const slow = defineCollection({
	loader: async () => {
		await new Promise((resolve) => setTimeout(resolve, 250));
		return [];
	},
});

export const collections = { posts, slow };

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const collections = {
	posts: defineCollection({
		loader: glob({ pattern: '*.md', base: './src/content/posts' }),
		schema: z.object({ title: z.string() }),
	}),
};

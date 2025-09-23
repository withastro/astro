import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
	}),
});

const blogMeta = defineCollection({
	loader: glob({ pattern: '**/*.{json,yaml}', base: './src/content/blogMeta' }),
	schema: z.object({
		title: z.string(),
	}),
});

export const collections = {
	blog,
	blogMeta,
};

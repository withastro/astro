import { defineCollection, reference, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

const posts = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/data/posts' }),
	schema: z.object({
		title: z.string(),
		pubDate: z.coerce.date(),
		tags: z.array(z.string()).default([]),
		draft: z.boolean().default(false),
		views: z.number().default(0),
		author: reference('authors'),
		meta: z.object({ featured: z.boolean().default(false) }).default({ featured: false }),
	}),
});

const authors = defineCollection({
	loader: file('./src/data/authors.json'),
	schema: z.object({
		name: z.string(),
		website: z.string().url().optional(),
	}),
});

export const collections = { posts, authors };

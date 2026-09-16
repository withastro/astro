import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const databasePosts = defineCollection({
	loader: file('src/database-posts.json'),
	schema: z.object({
		title: z.string(),
		order: z.number(),
		source: z.string(),
	}),
});

const localPosts = defineCollection({
	loader: () => [{ id: 'local', title: 'From a loader' }],
	schema: z.object({ title: z.string() }),
});

export const collections = { databasePosts, localPosts };

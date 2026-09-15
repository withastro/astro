import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const databasePosts = defineCollection({
	source: 'adapter',
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

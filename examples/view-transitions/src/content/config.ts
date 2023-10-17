import { z, defineCollection } from 'astro:content';

const movies = defineCollection({
	type: 'data',
	schema: z.object({
		data: z.any(),
	}),
});

// Expose your defined collection to Astro
// with the `collections` export
export const collections = { movies };

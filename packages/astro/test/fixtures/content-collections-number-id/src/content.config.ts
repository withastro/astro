import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const data = defineCollection({
	loader: async () => ([
		{ id: 1, title: 'One!' },
		{ id: 2, title: 'Two!' },
		{ id: 3, title: 'Three!' },
	]),
	schema: z.object({
		id: z.number(),
		title: z.string(),
	}),
});

export const collections = {
	data,
};

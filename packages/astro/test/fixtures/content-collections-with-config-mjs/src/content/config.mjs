import { z, defineCollection } from 'astro:content';

const blog = defineCollection({
	schema: z.object({
		title: z.string(),
	}),
});

export const collections = {
	blog
}

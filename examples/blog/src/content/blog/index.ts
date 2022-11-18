import { defineCollection, z } from 'astro:content';

export default defineCollection({
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.string().transform((str) => new Date(str)),
		updatedDate: z
			.string()
			.optional()
			.transform((str) => new Date(str)),
		heroImage: z.string().optional(),
	}),
});

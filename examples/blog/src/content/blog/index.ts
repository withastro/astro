import { defineCollection, z } from 'astro:content';

export default defineCollection({
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.string().transform((str) => new Date(str)),
		updatedDate: z
			.string()
			.optional()
			.transform((str) => (str ? new Date(str) : undefined)),
		heroImage: z.string().optional(),
	}),
});

import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	// Type must either be 'content' for showing page content or 'data' for data files (json, yaml, etc)
	type: 'content',
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string(),
		// Transform string to Date object
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
	}),
});

export const collections = { blog };

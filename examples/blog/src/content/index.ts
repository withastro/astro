import { defineCollections, z } from 'astro:content';

export default defineCollections({
	blog: {
		schema: {
			title: z.string(),
			description: z.string(),
			pubDate: z.string().transform((str) => new Date(str)),
			updatedDate: z
				.string()
				.optional()
				.transform((str) => (str ? new Date(str) : undefined)),
			heroImage: z.string().optional(),
		},
	},
});

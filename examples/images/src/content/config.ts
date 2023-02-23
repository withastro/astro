// 1. Import utilities from `astro:content`
import { asset, defineCollection, z } from 'astro:content';
// 2. Define a schema for each collection you'd like to validate.
const blogCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		image: asset({ width: 1920, height: 1120 }),
	}),
});
// 3. Export a single `collections` object to register your collection(s)
export const collections = {
	blog: blogCollection,
};

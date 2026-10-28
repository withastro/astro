import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: {
		name: 'test',
		load: async () => {},
		schema: () => z.object()
	}
});

export const collections = {
	blog,
};

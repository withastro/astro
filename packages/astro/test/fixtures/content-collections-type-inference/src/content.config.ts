import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import type { Loader } from 'astro/loaders';

function myLoader() {
	return {
		name: 'my-loader',
		load: async () => {},
		schema: z.object({
			test: z.string(),
		}),
	} satisfies Loader;
}

// Case 1: Loader with schema defined on the loader object
const blog = defineCollection({
	loader: myLoader(),
});

// Case 2: Legacy collection with schema on the collection (no loader)
const legacy = defineCollection({
	schema: z.object({
		title: z.string(),
		legacyField: z.boolean(),
	}),
});

// Case 3: Loader with no schema at all
const schemaless = defineCollection({
	loader: async () => [{ id: '1' }],
});

export const collections = {
	blog,
	legacy,
	schemaless,
};

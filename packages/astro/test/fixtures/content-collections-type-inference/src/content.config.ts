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

// Case 4: A Standard Schema validator that is not Zod. Written by hand so the fixture does
// not depend on a second validation library.
const standard = defineCollection({
	loader: async () => [{ id: '1', headline: 'Hello' }],
	schema: {
		'~standard': {
			version: 1,
			vendor: 'test-validator',
			validate: (value: unknown) => ({ value: value as { headline: string } }),
			types: {
				input: {} as { headline: string },
				output: {} as { headline: string },
			},
		},
	},
});

export const collections = {
	blog,
	legacy,
	schemaless,
	standard,
};

import { defineCollection, reference } from 'astro:content';
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

// Case 5: Loader that builds its schema while loading. There is nothing in the config to infer
// from, so `astro sync` generates the types the loader hands it into a file of their own and
// points the collection at that.
const dynamic = defineCollection({
	loader: {
		name: 'dynamic-loader',
		load: async () => {},
		createSchema: async () => ({
			schema: z.object({ headline: z.string() }),
			types: 'export interface Entry {\n\theadline: string;\n}',
		}),
	} satisfies Loader,
});

// Case 6: A schema that calls `reference()`. The reference is created inside the config, so
// this is what catches a `reference()` typed against the collections the config declares:
// the config's type would depend on itself, and every collection here would collapse to `any`.
const referencing = defineCollection({
	loader: async () => [{ id: '1', author: '1', legacyAuthor: '1' }],
	schema: z.object({
		author: z.string().transform((id) => reference('schemaless', id)),
		legacyAuthor: reference('schemaless'),
	}),
});

export const collections = {
	blog,
	legacy,
	schemaless,
	standard,
	dynamic,
	referencing,
};

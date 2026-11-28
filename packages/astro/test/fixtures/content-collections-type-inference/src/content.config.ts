import { defineCollection, reference } from 'astro:content';
import { reference as referenceField } from 'astro/content/fields';
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

const referencing = defineCollection({
	loader: async () => [{ id: '1', author: '1', legacyAuthor: '1' }],
	schema: z.object({
		author: z.string().transform((id) => referenceField('schemaless', id)),
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

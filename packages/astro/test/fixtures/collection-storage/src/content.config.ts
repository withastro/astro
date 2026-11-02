import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const storage = {
	entrypoint: new URL('../json-driver.mjs', import.meta.url),
	config: {
		dir: new URL('../.astro/json-driver/', import.meta.url).pathname,
		secretEnv: 'JSON_DRIVER_SECRET',
		expectedSecret: 'json-driver-secret',
	},
};

const docs = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/docs' }),
	schema: ({ image }) =>
		z.object({ title: z.string(), author: reference('authors'), cover: image().optional() }),
	storage,
});

// Shares the driver and the snapshot of `docs`
const guides = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/guides', deferRender: true }),
	schema: z.object({ title: z.string() }),
	storage,
});

const authors = defineCollection({
	loader: file('src/data/authors.json'),
	schema: z.object({ name: z.string() }),
});

export const collections = { docs, guides, authors };

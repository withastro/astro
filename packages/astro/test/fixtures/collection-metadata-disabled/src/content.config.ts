import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/docs' }),
	// Not an object, which only fails while `experimental.collectionMetadata` is enabled
	// @ts-expect-error descriptors must be an object
	descriptors: 'docs',
});

export const collections = { docs };

import { defineCollection, glob } from 'astro/loaders';
import { defineCollection as defineCollectionOrig } from 'astro:content';

const blog = defineCollectionOrig({
	loader: glob({ pattern: '*.md', base: './src/content/blog' }),
});

export const collections = { blog };

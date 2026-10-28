import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
	loader: glob({ pattern: '**/*.mdx', base: './src/content/docs' }),
});

export const collections = { docs };

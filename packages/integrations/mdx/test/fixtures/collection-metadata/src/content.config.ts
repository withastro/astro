import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/docs', deferRender: true }),
	descriptors: { library: 'docs' },
});

// Both collections load the same file, so its module can't belong to one of them
const first = defineCollection({ loader: glob({ pattern: '*.mdx', base: './src/shared' }) });
const second = defineCollection({ loader: glob({ pattern: '*.mdx', base: './src/shared' }) });

export const collections = { docs, first, second };

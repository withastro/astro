import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const something = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/data' }),
});

const liveStuff = defineCollection({
	type: 'live',
	entrypoint: './src/live/live-stuff.ts',
});

export const collections = { something, liveStuff };

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Lets tests simulate a content config load that fails during startup.
if ((globalThis as any).__throwInContentConfig) {
	throw new Error('Content config failed');
}

const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
	}),
});

// Lets tests simulate a loader failure during the sync that follows a restart.
const flaky = defineCollection({
	loader: async () => {
		if ((globalThis as any).__throwInFlakyLoader) {
			throw new Error('Flaky loader failed');
		}
		return [];
	},
});

export const collections = { blog, flaky };

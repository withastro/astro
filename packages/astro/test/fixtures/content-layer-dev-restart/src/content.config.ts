import { defineCollection } from 'astro:content';
import { image } from 'astro/content/image';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
	schema: (context) =>
		z.object({
			title: z.string(),
			// Root-absolute so resolving it needs Vite, and therefore the dev server's
			// plugin container during sync.
			cover: z.string().transform((src) => image(context, { src })),
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

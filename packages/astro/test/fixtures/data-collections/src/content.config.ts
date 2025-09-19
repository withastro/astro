import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
	schema: z.object({
		title: z.string(),
	})
});

const i18n = defineCollection({
	loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/i18n' }),
	schema: z.object({
		homepage: z.object({
			greeting: z.string(),
			preamble: z.string(),
		})
	}),
});

const authors = defineCollection({
	loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/authors' }),
});

export const collections = { docs, i18n, authors };

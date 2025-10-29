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

const func = defineCollection({
	loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/func' }),
	schema: () => z.object({
		homepage: z.object({
			greeting: z.string(),
			preamble: z.string(),
		})
	}),
});

const image = defineCollection({
	loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/image' }),
	schema: ({ image }) => z.object({
		homepage: z.object({
			greeting: z.string(),
			preamble: z.string(),
			image: image(),
		})
	}),
});

const authors = defineCollection({
	loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/authors' }),
});

export const collections = { docs, func, image, i18n, authors };

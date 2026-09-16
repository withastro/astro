import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const banners = defineCollection({
	loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/banners' }),
	schema: ({ image }) =>
		z.object({
			alt: z.string(),
			src: image(),
		}),
});

const authors = defineCollection({
	loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/authors' }),
	schema: z.object({
		name: z.string(),
		twitter: z.string().url(),
	}),
});

const blog = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		// Deprecated `reference(collection)` schema form, kept here so both signatures stay
		// covered.
		banner: reference('banners'),
		author: z.string().transform((id) => reference('authors', id)),
		relatedPosts: z.array(z.string().transform((id) => reference('blog', id))).optional(),
	}),
});

export const collections = { blog, authors, banners };

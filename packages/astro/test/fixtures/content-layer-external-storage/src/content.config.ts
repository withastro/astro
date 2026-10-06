import { defineCollection, reference } from 'astro:content';
import { externalFile, externalGlob, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
	loader: externalGlob({ pattern: '*.md', base: './src/data/posts' }),
	storage: 'external',
	schema: z.object({
		title: z.string(),
		author: reference('authors'),
	}),
});

const authors = defineCollection({
	loader: externalFile('src/data/authors.json'),
	storage: 'external',
	schema: z.object({
		name: z.string(),
	}),
});

const notes = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/data/notes' }),
	schema: z.object({
		title: z.string(),
	}),
});

export const collections = { posts, authors, notes };

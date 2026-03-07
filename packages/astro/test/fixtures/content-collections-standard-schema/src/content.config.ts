import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import * as v from 'valibot';

// banners: image via transform
const banners = defineCollection({
	loader: glob({ pattern: '**/*.json', base: './src/content/banners' }),
	schema: v.object({
		alt: v.string(),
		src: v.string(),
	}),
	transform: async (data, { image }) => ({
		...data,
		src: await image(data.src),
	}),
});

// authors: plain schema, no transform
const authors = defineCollection({
	loader: glob({ pattern: '**/*.json', base: './src/content/authors' }),
	schema: v.object({
		name: v.string(),
	}),
});

// blog: reference via transform (2-arg form)
const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
	schema: v.object({
		title: v.string(),
		author: v.string(),
	}),
	transform: (data) => ({
		...data,
		author: reference('authors', data.author),
	}),
});

export const collections = { banners, authors, blog };

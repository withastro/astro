import { defineCollection, z, reference } from 'astro:content';

const banners = defineCollection({
	type: 'data',
	schema: ({ image }) =>
		z.object({
			alt: z.string(),
			src: image(),
		}),
});

const authors = defineCollection({
	type: 'data',
	schema: ({ image }) =>
		z.object({
			name: z.string(),
			avatar: image().optional(),
		}),
});

const blog = defineCollection({
	schema: z.object({
		title: z.string(),
		banner: reference('banners'),
		author: reference('authors'),
	}),
});

export const collections = { blog, authors, banners };

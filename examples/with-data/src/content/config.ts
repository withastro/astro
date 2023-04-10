import { defineCollection, defineDataCollection, z, reference } from 'astro:content';

const blog = defineCollection({
	schema: z.object({
		title: z.string(),
		banner: reference('banners'),
		author: reference('authors'),
	}),
});

const banners = defineDataCollection({
	schema: ({ image }) =>
		z.object({
			alt: z.string(),
			src: image(),
		}),
});

const authors = defineDataCollection({
	schema: ({ image }) =>
		z.object({
			name: z.string(),
			avatar: image().optional(),
		}),
});

export const collections = { blog, authors, banners };

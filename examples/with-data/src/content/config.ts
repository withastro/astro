import { defineCollection, defineDataCollection, z } from 'astro:content';

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

const blog = defineCollection({
	schema: z.object({
		title: z.string(),
		banner: banners.reference(),
		author: authors.reference(),
	}),
});

export const collections = { blog, authors, banners };

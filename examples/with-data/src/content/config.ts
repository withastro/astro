import { defineCollection, defineDataCollection, z } from 'astro:content';

const blog = defineCollection({
	schema: z.object({
		title: z.string(),
		description: z.string(),
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

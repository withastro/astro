import type { ImageMetadata } from 'astro';
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	schema: ({ image }) =>
		z.object({
			image: z
				.string()
				.regex(/^https:.*/)
				.transform(
					(url) =>
						({
							src: url,
							width: 1200,
							height: 630,
							format: 'jpeg',
						}) satisfies ImageMetadata
				)
				.or(image()),
		}),
});

export const collections = { blog };

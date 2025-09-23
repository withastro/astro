import type { ImageMetadata } from 'astro';
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
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

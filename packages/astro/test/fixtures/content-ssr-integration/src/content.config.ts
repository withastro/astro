import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { image } from 'astro/content/fields';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
	// The build must resolve this image without bundling Node.js modules in `astro:content`.
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z
			.string()
			.transform((src) => image(src))
			.optional(),
	}),
});

export const collections = { blog };

import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { image } from 'astro/content/image';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
	// `heroImage` is resolved through `astro/content/image` on purpose. This fixture is the
	// one built with `preventNodeBuiltinDependencyPlugin`, so routing a field through that
	// Node-only module is what makes the build assert it never reaches the `astro:content`
	// runtime bundle, which has to keep running on Cloudflare and Deno.
	schema: (context) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z
				.string()
				.transform((src) => image(context, { src }))
				.optional(),
		}),
});

export const collections = { blog };

import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.mdoc', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
	}).transform(data => ({
		...data,
		schemaWorks: true,
	}))
});

export const collections = { blog };

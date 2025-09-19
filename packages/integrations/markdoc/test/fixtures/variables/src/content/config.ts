import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.mdoc', base: './src/content/blog' }),
	schema: z.object({
		title: z.string().transform(v => 'Processed by schema: ' + v),
	}),
});

export const collections = { blog }

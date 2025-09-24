import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx,mdoc}', base: './src/content/blog' }),
});

export const collections = {
	blog,
};

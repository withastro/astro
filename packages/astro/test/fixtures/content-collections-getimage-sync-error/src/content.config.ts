import { getImage } from 'astro:assets';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

await getImage({
	src: 'https://example.com/test.png',
	width: 1,
	height: 1,
});

const docs = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
	schema: z.object({
		title: z.string(),
	}),
});

export const collections = {
	docs,
};

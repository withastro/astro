import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const docs = defineCollection({
	loader: glob({ pattern: '**/*.mdx', base: './src/content/docs' }),
	schema: z.object({ title: z.string() }),
});

export const collections = { docs };

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const theme = defineCollection({
	loader: glob({ pattern: 'theme.json', base: './src/content' }),
	schema: z.object({ colors: z.object({ text: z.string() }) }),
});

export const collections = { theme };

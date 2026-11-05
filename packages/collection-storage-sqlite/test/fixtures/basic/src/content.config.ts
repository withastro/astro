import { sqlite } from '@astrojs/collection-storage-sqlite';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const docs = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/docs' }),
	schema: z.object({ title: z.string() }),
	storage: sqlite({ url: 'file:.astro/collections.db' }),
});

export const collections = { docs };

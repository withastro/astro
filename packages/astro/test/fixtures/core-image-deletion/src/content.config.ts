import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.*', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
  })
});

export const collections = {
	blog: blog,
};

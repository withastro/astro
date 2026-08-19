import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from "astro/loaders";

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({image}) => z.object({
    title: z.string(),
    cover: image(),
  }),
});

export const collections = {
  blog: blogCollection,
};

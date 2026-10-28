import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      cover: image(),
    }),
});

export const collections = {
  articles,
};

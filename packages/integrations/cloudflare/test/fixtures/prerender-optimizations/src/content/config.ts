import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

export const collections = {
  posts: defineCollection({
    schema: z.any(),
  }),
}

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({image}) => z.object({
    title: z.string(),
    image: image(),
  }), 
});

export const collections = {
	blog: blogCollection
};

import { defineCollection, z, image } from "astro:content";

const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    cover: image(),
  }),
});

export const collections = {
  blog: blogCollection,
};

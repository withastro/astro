import { image, defineCollection, z } from "astro:content";

const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    image: image(),
  }),
});

export const collections = {
	blog: blogCollection
};

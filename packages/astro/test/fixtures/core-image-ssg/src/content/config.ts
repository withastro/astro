import { defineCollection, image, z } from "astro:content";

const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    image: image(),
		cover: z.object({
			image: image()
		})
  }),
});

export const collections = {
	blog: blogCollection
};

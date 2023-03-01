import { asset, defineCollection, z } from "astro:content";

const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    image: asset({ width: 207, height: 243 }),
  }),
});

export const collections = {
	blog: blogCollection
};

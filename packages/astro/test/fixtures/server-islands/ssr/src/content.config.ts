import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

export const collections = {
  posts: defineCollection({
    loader: glob({ base: "./src/content/posts", pattern: "**/*.mdx" }),
  }),
};

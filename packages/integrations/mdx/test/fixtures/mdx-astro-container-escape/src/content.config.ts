import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const posts = defineCollection({
	loader: glob({
		pattern: "**/*.{md,mdx}",
		base: "src/posts",
	}),
	schema: () =>
		z.object({
			title: z.string(),
		}),
});

export const collections = {
	posts
};

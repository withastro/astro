import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

const en = defineCollection({
	loader: glob({
		base: './src/content/en/',
		pattern: '*.md',
	})
});

export const collections = {
	en
};

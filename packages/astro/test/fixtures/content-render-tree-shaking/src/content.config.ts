import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
	// Keep the raw body out of the data store, so the test's marker string can only
	// reach the server bundle through a compiled entry module.
	loader: glob({ pattern: '*.mdx', base: './src/content/posts', retainBody: false }),
});

export const collections = { posts };

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const entries = defineCollection({
	// Load Markdown and MDX files in the `src/content/entries/` directory.
	loader: glob({ base: './src/content/entries', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: () =>
		z.object({
			title: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
		}),
});

export const collections = { entries };

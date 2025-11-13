import { defineCollection, z } from 'astro:content';
import { defineContentLoader, glob } from 'astro/loaders';

const test = (options: Parameters<typeof glob>[0]) =>
	defineContentLoader({
		name: 'test',
		load: glob(options).load,
		// schema: z.object({
		// 	title: z.string(),
		// 	description: z.string(),
		// 	// Transform string to Date object
		// 	pubDate: z.coerce.date(),
		// 	updatedDate: z.coerce.date().optional(),
		// 	heroImage: z.string().optional(),
		// }),
		getSchemaContext: async () => {
			return {
				schema: z.object({
					title: z.string(),
					description: z.string(),
					// Transform string to Date object
					pubDate: z.coerce.date(),
					updatedDate: z.coerce.date().optional(),
					heroImage: z.string().optional(),
				}),
				types: `import type { ImageMetadata } from "astro";

export interface Collection {
	title: string;
	description: string;
	pubDate: Date;
	updateDate: Date | undefined;
	heroImage: ImageMetadata | undefined;
}`,
			};
		},
	});

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: test({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	// schema: ({ image }) =>
	// 	z.object({
	// 		title: z.string(),
	// 		description: z.string(),
	// 		// Transform string to Date object
	// 		pubDate: z.coerce.date(),
	// 		updatedDate: z.coerce.date().optional(),
	// 		heroImage: image().optional(),
	// 	}),
});

export const collections = { blog };

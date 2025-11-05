import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string().describe("The blog post's title.").optional(),
		description: z.string().optional(),
		tags: z.array(z.string()).optional(),
		type: z.enum(['blog']).or(z.null()).optional(),
	}),
});

const caching = defineCollection({
	loader: glob({ base: './src/content/caching', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string().describe('I will be changed'),
	}),
});

export const collections = { blog, caching };

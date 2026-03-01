import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const withData = defineCollection({
	loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/with-data' }),
	schema: z.object({
		title: z.string(),
	}),
});

const withCustomSlugs = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/with-custom-slugs' }),
	// Ensure schema passes even when `slug` is present
	schema: z
		.object({
			slug: z.string().optional(),
		})
		.strict(),
});

const withSchemaConfig = defineCollection({
	loader: glob({
		pattern: [
			'**/*.{md,mdx}', 	// Include all markdown files
			'!**/_*/**', 			// Exclude anything in directories starting with _
			'!**/_*.{md,mdx}',// Exclude files starting with _
		],
		base: './src/content/with-schema-config',
		// Preserve special characters like % in filenames
		generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ''),
	}),
	schema: z.object({
		title: z.string(),
		isDraft: z.boolean().default(false),
		lang: z.enum(['en', 'fr', 'es']).default('en'),
		publishedAt: z.date().transform((val) => new Date(val)),
	}),
});

const withUnionSchema = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/with-union-schema' }),
	schema: z.discriminatedUnion('type', [
		z.object({
			type: z.literal('post'),
			title: z.string(),
			description: z.string(),
		}),
		z.object({
			type: z.literal('newsletter'),
			subject: z.string(),
		}),
	]),
});

const withSymlinkedData = defineCollection({
	loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/with-symlinked-data' }),
	schema: ({ image }) =>
		z.object({
			alt: z.string(),
			src: image(),
		}),
});

const withSymlinkedContent = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/with-symlinked-content' }),
	schema: z.object({
		title: z.string(),
		date: z.date(),
	}),
});

const withScripts = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/with-scripts' }),
});

export const collections = {
	'with-data': withData,
	'with-custom-slugs': withCustomSlugs,
	'with-schema-config': withSchemaConfig,
	'with-union-schema': withUnionSchema,
	'with-symlinked-data': withSymlinkedData,
	'with-symlinked-content': withSymlinkedContent,
	'with-scripts': withScripts,
};

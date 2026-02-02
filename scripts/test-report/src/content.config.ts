import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ pattern: './reports/*.json' }),
	schema: z.array(z.object({
		file: z.string().optional(),
		column: z.number().optional(),
		line: z.number().optional(),
		details: z.object({
			duration_ms: z.number(),
			error: z.string(),
			type: z.optional(z.literal("suite")),
		}),
		name: z.string(),
		nesting: z.number(),
		testNumber: z.number(),
		todo: z.union([z.string(), z.boolean()]).optional(),
		skip: z.union([z.string(), z.boolean()]).optional(),
	}))
});

export const collections = { blog };

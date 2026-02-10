import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const testEntry = z.object({
	file: z.string().optional(),
	column: z.number().optional(),
	line: z.number().optional(),
	name: z.string(),
	nesting: z.number(),
	testNumber: z.number(),
	details: z.object({
		duration_ms: z.number(),
		error: z.unknown().optional(),
		type: z.string().optional(),
	}).passthrough(),
	path: z.array(z.string()).optional(),
	todo: z.union([z.string(), z.boolean()]).optional(),
	skip: z.union([z.string(), z.boolean()]).optional(),
}).passthrough();

const reports = defineCollection({
	loader: glob({ pattern: '**/*.json', base: 'src/reports' }),
	schema: z.array(testEntry),
});

export const collections = { reports };

import { z } from 'zod';

export const schema = z.object({
	title: z.string(),
	description: z.string().max(60, 'For SEO purposes, keep descriptions short!'),
	// mark optional properties with `.optional()`
	image: z.string().optional(),
	tags: z.array(z.string()).default([]),
	// transform to another data type with `transform`
	// ex. convert date strings to Date objects
	publishedDate: z.string().transform((str) => new Date(str)),
});

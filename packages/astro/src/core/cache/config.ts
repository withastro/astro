import * as z from 'zod/v4';

export const CacheDriverConfigSchema = z.object({
	config: z.record(z.string(), z.any()).optional(),
	entrypoint: z.union([z.string(), z.instanceof(URL)]),
});

export const CacheOptionsSchema = z.object({
	maxAge: z.number().optional(),
	swr: z.number().optional(),
	tags: z.array(z.string()).optional(),
});

export const CacheSchema = z.object({
	driver: z.union([z.string(), CacheDriverConfigSchema]).optional(),
	routes: z.record(z.string(), CacheOptionsSchema).optional(),
});

import z from 'zod/v3';

const SessionDriverConfigSchema = z.object({
	name: z.string(),
	options: z.record(z.string(), z.any()).optional(),
	entrypoint: z.union([z.string(), z.instanceof(URL)]),
});

export const SessionSchema = z.object({
	driver: z.union([
		z.string().transform((v) => {
			console.warn('TODO: deprecated');
			return v;
		}),
		SessionDriverConfigSchema,
	]),
	options: z.record(z.any()).optional(),
	cookie: z
		.union([
			z.object({
				name: z.string().optional(),
				domain: z.string().optional(),
				path: z.string().optional(),
				maxAge: z.number().optional(),
				sameSite: z.union([z.enum(['strict', 'lax', 'none']), z.boolean()]).optional(),
				secure: z.boolean().optional(),
			}),
			z.string().transform((name) => ({ name })),
		])
		.optional(),
	ttl: z.number().optional(),
});

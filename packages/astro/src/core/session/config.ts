import z from 'zod/v4';

export const SessionDriverConfigSchema = z.object({
	options: z.record(z.string(), z.any()).optional(),
	entrypoint: z.union([z.string(), z.instanceof(URL)]),
});

export const SessionSchema = z.object({
	driver: z.union([
		z.string().superRefine(() => {
			console.warn(
				`Using deprecated \`session.driver\` string signature. Learn how to migrate: https://v6.docs.astro.build/en/guides/upgrade-to/v6/#deprecated-session-driver-string-signature`,
			);
		}),
		SessionDriverConfigSchema,
	]),
	options: z.record(z.string(), z.any()).optional(),
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

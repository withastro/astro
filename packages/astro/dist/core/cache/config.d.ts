import * as z from 'zod/v4';
/**
 * Cache provider configuration (experimental.cache).
 * Provider only - routes are configured via experimental.routeRules.
 */
export declare const CacheSchema: z.ZodObject<
	{
		provider: z.ZodOptional<
			z.ZodObject<
				{
					config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
					entrypoint: z.ZodUnion<readonly [z.ZodString, z.ZodCustom<URL, URL>]>;
					name: z.ZodOptional<z.ZodString>;
				},
				z.core.$strip
			>
		>;
	},
	z.core.$strip
>;
/**
 * Route rules configuration (experimental.routeRules).
 * Maps glob patterns to route rules.
 *
 * Example:
 * ```ts
 * routeRules: {
 *   '/api/*': { swr: 600 },
 *   '/products/*': { maxAge: 3600, tags: ['products'] },
 * }
 * ```
 */
export declare const RouteRulesSchema: z.ZodRecord<
	z.ZodString,
	z.ZodObject<
		{
			maxAge: z.ZodOptional<z.ZodNumber>;
			swr: z.ZodOptional<z.ZodNumber>;
			tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
		},
		z.core.$strip
	>
>;

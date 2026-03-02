import * as z from 'zod/v4';

const CacheProviderConfigSchema = z.object({
	config: z.record(z.string(), z.any()).optional(),
	entrypoint: z.union([z.string(), z.instanceof(URL)]),
	name: z.string().optional(),
});

/**
 * Cache options that can be applied to a route.
 */
const CacheOptionsSchema = z.object({
	maxAge: z.number().int().min(0).optional(),
	swr: z.number().int().min(0).optional(),
	tags: z.array(z.string()).optional(),
});

/**
 * Cache provider configuration (experimental.cache).
 * Provider only - routes are configured via experimental.routeRules.
 */
export const CacheSchema = z.object({
	provider: CacheProviderConfigSchema.optional(),
});

const RouteRuleSchema = CacheOptionsSchema;

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
export const RouteRulesSchema = z.record(z.string(), RouteRuleSchema);

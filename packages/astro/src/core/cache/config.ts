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
 * Cache provider configuration (`cache`).
 * Provider only - routes are configured via `routeRules`.
 */
export const CacheSchema = z.object({
	provider: CacheProviderConfigSchema.optional(),
});

const RouteRuleSchema = CacheOptionsSchema;

/**
 * Route rules configuration (`routeRules`).
 * Maps route patterns to route rules. Patterns use the same `[param]` and
 * `[...rest]` syntax as file-based routing; glob wildcards (`*`) are not supported.
 *
 * Example:
 * ```ts
 * routeRules: {
 *   '/api/[...path]': { swr: 600 },
 *   '/products/[...slug]': { maxAge: 3600, tags: ['products'] },
 * }
 * ```
 */
export const RouteRulesSchema = z.record(z.string(), RouteRuleSchema);

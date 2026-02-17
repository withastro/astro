import * as z from 'zod/v4';

export const CacheProviderConfigSchema = z.object({
	config: z.record(z.string(), z.any()).optional(),
	entrypoint: z.union([z.string(), z.instanceof(URL)]),
});

/**
 * Cache options that can be applied to a route.
 * Used both in nested `cache: {}` form and as flat shortcuts.
 */
export const CacheOptionsSchema = z.object({
	maxAge: z.number().optional(),
	swr: z.number().optional(),
	tags: z.array(z.string()).optional(),
});

/**
 * Cache provider configuration (experimental.cache).
 * Provider only - routes are configured via experimental.routeRules.
 */
export const CacheSchema = z.object({
	provider: z.union([z.string(), CacheProviderConfigSchema]).optional(),
});

/**
 * Route rule with Nitro-style cache shortcuts.
 *
 * Supports two forms:
 * - Shortcuts: `{ maxAge: 3600, swr: 600 }` - flat cache options at rule level
 * - Full form: `{ cache: { maxAge: 3600, swr: 600 } }` - nested under cache key
 *
 * Also supports:
 * - `prerender: boolean` - whether to prerender the route at build time
 *
 * Examples:
 * ```ts
 * routeRules: {
 *   '/api/*': { swr: 600 },                              // shortcut
 *   '/products/*': { cache: { maxAge: 3600, tags: ['products'] } }, // full
 *   '/about': { prerender: true },                       // static
 *   '/dashboard/*': { maxAge: 60, prerender: false },    // dynamic + cached
 * }
 * ```
 */
export const RouteRuleSchema = z.object({
	// Nested cache options (full form)
	cache: CacheOptionsSchema.optional(),
	// Flat cache shortcuts (Nitro-style)
	maxAge: z.number().optional(),
	swr: z.number().optional(),
	tags: z.array(z.string()).optional(),
	// Prerender control
	prerender: z.boolean().optional(),
});

/**
 * Route rules configuration (experimental.routeRules).
 * Maps glob patterns to route rules.
 */
export const RouteRulesSchema = z.record(z.string(), RouteRuleSchema);

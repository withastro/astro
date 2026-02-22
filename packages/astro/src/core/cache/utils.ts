import type { AstroConfig } from '../../types/public/index.js';
import type {
	CacheOptions,
	CacheProviderConfig,
	NormalizedCacheProviderConfig,
	SSRManifestCache,
} from './types.js';

export function normalizeCacheProviderConfig(
	provider: CacheProviderConfig,
): NormalizedCacheProviderConfig {
	return {
		entrypoint: provider.entrypoint instanceof URL ? provider.entrypoint.href : provider.entrypoint,
		config: provider.config,
	};
}

/**
 * Normalize a route rule to extract cache options.
 * Handles both Nitro-style shortcuts (flat) and nested `cache:` form.
 */
export function normalizeRouteRuleCacheOptions(
	rule:
		| {
				cache?: CacheOptions;
				maxAge?: number;
				swr?: number;
				tags?: string[];
		  }
		| undefined,
): CacheOptions | undefined {
	if (!rule) return undefined;

	// Check for flat shortcuts
	const hasShortcuts =
		rule.maxAge !== undefined || rule.swr !== undefined || rule.tags !== undefined;
	// Check for nested cache
	const hasNested = rule.cache !== undefined;

	if (!hasShortcuts && !hasNested) {
		return undefined;
	}

	// Merge: nested cache takes precedence, then shortcuts
	return {
		maxAge: rule.cache?.maxAge ?? rule.maxAge,
		swr: rule.cache?.swr ?? rule.swr,
		tags: rule.cache?.tags ?? rule.tags,
	};
}

/**
 * Extract cache routes from experimental.routeRules config.
 * Normalizes both flat shortcuts and nested `cache:` form.
 */
export function extractCacheRoutesFromRouteRules(
	routeRules: AstroConfig['experimental']['routeRules'],
): Record<string, CacheOptions> | undefined {
	if (!routeRules) return undefined;

	const cacheRoutes: Record<string, CacheOptions> = {};

	for (const [pattern, rule] of Object.entries(routeRules)) {
		const cacheOptions = normalizeRouteRuleCacheOptions(rule);
		if (cacheOptions) {
			cacheRoutes[pattern] = cacheOptions;
		}
	}

	return Object.keys(cacheRoutes).length > 0 ? cacheRoutes : undefined;
}

export function cacheConfigToManifest(
	cacheConfig: AstroConfig['experimental']['cache'],
	routeRulesConfig: AstroConfig['experimental']['routeRules'],
): SSRManifestCache | undefined {
	if (!cacheConfig?.provider) {
		return undefined;
	}

	const provider = normalizeCacheProviderConfig(cacheConfig.provider);
	const routes = extractCacheRoutesFromRouteRules(routeRulesConfig);

	return {
		provider: provider.entrypoint,
		options: provider.config,
		routes,
	};
}

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
		name: provider.name,
		entrypoint: provider.entrypoint instanceof URL ? provider.entrypoint.href : provider.entrypoint,
		config: provider.config,
	};
}

/**
 * Normalize a route rule to extract cache options.
 */
export function normalizeRouteRuleCacheOptions(
	rule:
		| {
				maxAge?: number;
				swr?: number;
				tags?: string[];
		  }
		| undefined,
): CacheOptions | undefined {
	if (!rule) return undefined;

	if (rule.maxAge === undefined && rule.swr === undefined && rule.tags === undefined) {
		return undefined;
	}

	return {
		maxAge: rule.maxAge,
		swr: rule.swr,
		tags: rule.tags,
	};
}

/**
 * Extract cache routes from experimental.routeRules config.
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

import { fileURLToPath } from 'node:url';
import type { AstroConfig } from '../../types/public/index.js';
import type {
	CacheHint,
	CacheOptions,
	CacheProviderConfig,
	LiveDataEntry,
	NormalizedCacheProviderConfig,
	SSRManifestCache,
} from './types.js';

export function normalizeCacheProviderConfig(
	provider: string | CacheProviderConfig,
): NormalizedCacheProviderConfig {
	if (typeof provider === 'string') {
		return { entrypoint: provider, config: undefined };
	}
	return {
		entrypoint:
			provider.entrypoint instanceof URL ? fileURLToPath(provider.entrypoint) : provider.entrypoint,
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

/**
 * Generate default cache response headers from CacheOptions.
 * Used when the provider doesn't supply its own `setHeaders()`.
 */
export function defaultSetHeaders(options: CacheOptions): Headers {
	const headers = new Headers();

	// CDN-Cache-Control
	const directives: string[] = [];
	if (options.maxAge !== undefined) {
		directives.push(`max-age=${options.maxAge}`);
	}
	if (options.swr !== undefined) {
		directives.push(`stale-while-revalidate=${options.swr}`);
	}
	if (directives.length > 0) {
		headers.set('CDN-Cache-Control', directives.join(', '));
	}

	// Cache-Tag
	if (options.tags && options.tags.length > 0) {
		headers.set('Cache-Tag', options.tags.join(', '));
	}

	// Last-Modified
	if (options.lastModified) {
		headers.set('Last-Modified', options.lastModified.toUTCString());
	}

	// ETag
	if (options.etag) {
		headers.set('ETag', options.etag);
	}

	return headers;
}

export function isCacheHint(value: unknown): value is CacheHint {
	return value != null && typeof value === 'object' && 'tags' in value;
}

export function isLiveDataEntry(value: unknown): value is LiveDataEntry {
	return (
		value != null &&
		typeof value === 'object' &&
		'id' in value &&
		'data' in value &&
		'cacheHint' in value
	);
}

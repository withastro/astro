function normalizeCacheProviderConfig(provider) {
	return {
		name: provider.name,
		entrypoint: provider.entrypoint instanceof URL ? provider.entrypoint.href : provider.entrypoint,
		config: provider.config,
	};
}
function normalizeRouteRuleCacheOptions(rule) {
	if (!rule) return void 0;
	if (rule.maxAge === void 0 && rule.swr === void 0 && rule.tags === void 0) {
		return void 0;
	}
	return {
		maxAge: rule.maxAge,
		swr: rule.swr,
		tags: rule.tags,
	};
}
function extractCacheRoutesFromRouteRules(routeRules) {
	if (!routeRules) return void 0;
	const cacheRoutes = {};
	for (const [pattern, rule] of Object.entries(routeRules)) {
		const cacheOptions = normalizeRouteRuleCacheOptions(rule);
		if (cacheOptions) {
			cacheRoutes[pattern] = cacheOptions;
		}
	}
	return Object.keys(cacheRoutes).length > 0 ? cacheRoutes : void 0;
}
function cacheConfigToManifest(cacheConfig, routeRulesConfig) {
	if (!cacheConfig?.provider) {
		return void 0;
	}
	const provider = normalizeCacheProviderConfig(cacheConfig.provider);
	const routes = extractCacheRoutesFromRouteRules(routeRulesConfig);
	return {
		provider: provider.entrypoint,
		options: provider.config,
		routes,
	};
}
export {
	cacheConfigToManifest,
	extractCacheRoutesFromRouteRules,
	normalizeCacheProviderConfig,
	normalizeRouteRuleCacheOptions,
};

import { stringifyParams } from '../routing/params.js';
import { validateDynamicRouteModule, validateGetStaticPathsResult } from '../routing/validation.js';
import { generatePaginateFunction } from './paginate.js';
async function callGetStaticPaths({ mod, route, routeCache, ssr, base, trailingSlash }) {
	const cached = routeCache.get(route);
	if (!mod) {
		throw new Error('This is an error caused by Astro and not your code. Please file an issue.');
	}
	if (cached?.staticPaths) {
		return cached.staticPaths;
	}
	validateDynamicRouteModule(mod, { ssr, route });
	if (ssr && !route.prerender) {
		const entry = Object.assign([], { keyed: /* @__PURE__ */ new Map() });
		routeCache.set(route, { ...cached, staticPaths: entry });
		return entry;
	}
	let staticPaths = [];
	if (!mod.getStaticPaths) {
		throw new Error('Unexpected Error.');
	}
	staticPaths = await mod.getStaticPaths({
		// Q: Why the cast?
		// A: So users downstream can have nicer typings, we have to make some sacrifice in our internal typings, which necessitate a cast here
		paginate: generatePaginateFunction(route, base, trailingSlash),
		routePattern: route.route,
	});
	validateGetStaticPathsResult(staticPaths, route);
	const keyedStaticPaths = staticPaths;
	keyedStaticPaths.keyed = /* @__PURE__ */ new Map();
	for (const sp of keyedStaticPaths) {
		const paramsKey = stringifyParams(sp.params, route, trailingSlash);
		keyedStaticPaths.keyed.set(paramsKey, sp);
	}
	routeCache.set(route, { ...cached, staticPaths: keyedStaticPaths });
	return keyedStaticPaths;
}
class RouteCache {
	logger;
	cache = {};
	runtimeMode;
	constructor(logger, runtimeMode = 'production') {
		this.logger = logger;
		this.runtimeMode = runtimeMode;
	}
	/** Clear the cache. */
	clearAll() {
		this.cache = {};
	}
	set(route, entry) {
		const key = this.key(route);
		if (this.runtimeMode === 'production' && this.cache[key]?.staticPaths) {
			this.logger.warn(null, `Internal Warning: route cache overwritten. (${key})`);
		}
		this.cache[key] = entry;
	}
	get(route) {
		return this.cache[this.key(route)];
	}
	key(route) {
		return `${route.route}_${route.component}`;
	}
}
function findPathItemByKey(staticPaths, params, route, logger, trailingSlash) {
	const paramsKey = stringifyParams(params, route, trailingSlash);
	const matchedStaticPath = staticPaths.keyed.get(paramsKey);
	if (matchedStaticPath) {
		return matchedStaticPath;
	}
	logger.debug('router', `findPathItemByKey() - Unexpected cache miss looking for ${paramsKey}`);
}
export { RouteCache, callGetStaticPaths, findPathItemByKey };

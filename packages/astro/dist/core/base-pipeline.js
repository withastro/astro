import { NOOP_ACTIONS_MOD } from '../actions/noop-actions.js';
import { createOriginCheckMiddleware } from './app/middlewares.js';
import { ActionNotFoundError } from './errors/errors-data.js';
import { AstroError } from './errors/index.js';
import { NOOP_MIDDLEWARE_FN } from './middleware/noop-middleware.js';
import { sequence } from './middleware/sequence.js';
import { RedirectSinglePageBuiltModule } from './redirects/index.js';
import { RouteCache } from './render/route-cache.js';
import { createDefaultRoutes } from './routing/default.js';
import { ensure404Route } from './routing/astro-designed-error-pages.js';
import { Router } from './routing/router.js';
import { NodePool } from '../runtime/server/render/queue/pool.js';
import { HTMLStringCache } from '../runtime/server/html-string-cache.js';
import { FORBIDDEN_PATH_KEYS } from '@astrojs/internal-helpers/object';
import { loadLogger } from './logger/load.js';
const PipelineFeatures = {
	redirects: 1 << 0,
	sessions: 1 << 1,
	actions: 1 << 2,
	middleware: 1 << 3,
	i18n: 1 << 4,
	cache: 1 << 5,
};
class Pipeline {
	internalMiddleware;
	resolvedMiddleware = void 0;
	resolvedLogger = false;
	resolvedActions = void 0;
	resolvedSessionDriver = void 0;
	resolvedCacheProvider = void 0;
	compiledCacheRoutes = void 0;
	nodePool;
	htmlStringCache;
	/**
	 * Bit mask of pipeline features activated by handler classes.
	 * Each handler sets its bit via `|=`. Only meaningful when a
	 * custom `src/app.ts` fetch handler is in use.
	 */
	usedFeatures = 0;
	logger;
	manifest;
	/**
	 * "development" or "production" only
	 */
	runtimeMode;
	renderers;
	resolve;
	streaming;
	/**
	 * Used to provide better error messages for `Astro.clientAddress`
	 */
	adapterName;
	clientDirectives;
	inlinedScripts;
	compressHTML;
	i18n;
	middleware;
	routeCache;
	/**
	 * Used for `Astro.site`.
	 */
	site;
	/**
	 * Array of built-in, internal, routes.
	 * Used to find the route module
	 */
	defaultRoutes;
	actions;
	sessionDriver;
	cacheProvider;
	cacheConfig;
	serverIslands;
	/** Route data derived from the manifest, used for route matching. */
	manifestData;
	/** Pattern-matching router built from manifestData. */
	#router;
	constructor(
		logger,
		manifest,
		runtimeMode,
		renderers,
		resolve,
		streaming,
		adapterName = manifest.adapterName,
		clientDirectives = manifest.clientDirectives,
		inlinedScripts = manifest.inlinedScripts,
		compressHTML = manifest.compressHTML,
		i18n = manifest.i18n,
		middleware = manifest.middleware,
		routeCache = new RouteCache(logger, runtimeMode),
		site = manifest.site ? new URL(manifest.site) : void 0,
		defaultRoutes = createDefaultRoutes(manifest),
		actions = manifest.actions,
		sessionDriver = manifest.sessionDriver,
		cacheProvider = manifest.cacheProvider,
		cacheConfig = manifest.cacheConfig,
		serverIslands = manifest.serverIslandMappings,
	) {
		this.logger = logger;
		this.manifest = manifest;
		this.runtimeMode = runtimeMode;
		this.renderers = renderers;
		this.resolve = resolve;
		this.streaming = streaming;
		this.adapterName = adapterName;
		this.clientDirectives = clientDirectives;
		this.inlinedScripts = inlinedScripts;
		this.compressHTML = compressHTML;
		this.i18n = i18n;
		this.middleware = middleware;
		this.routeCache = routeCache;
		this.site = site;
		this.defaultRoutes = defaultRoutes;
		this.actions = actions;
		this.sessionDriver = sessionDriver;
		this.cacheProvider = cacheProvider;
		this.cacheConfig = cacheConfig;
		this.serverIslands = serverIslands;
		this.manifestData = { routes: (manifest.routes ?? []).map((route) => route.routeData) };
		ensure404Route(this.manifestData);
		this.#router = new Router(this.manifestData.routes, {
			base: manifest.base,
			trailingSlash: manifest.trailingSlash,
			buildFormat: manifest.buildFormat,
		});
		this.internalMiddleware = [];
		if (manifest.experimentalQueuedRendering.enabled) {
			this.nodePool = this.createNodePool(
				manifest.experimentalQueuedRendering.poolSize ?? 1e3,
				false,
			);
			if (manifest.experimentalQueuedRendering.contentCache) {
				this.htmlStringCache = this.createStringCache();
			}
		}
	}
	/**
	 * Low-level route matching against the manifest routes. Returns the
	 * matched `RouteData` or `undefined`. Does not filter prerendered
	 * routes or check public assets — use `BaseApp.match()` for that.
	 */
	matchRoute(pathname) {
		const match = this.#router.match(pathname, { allowWithoutBase: true });
		if (match.type !== 'match') return void 0;
		return match.route;
	}
	/**
	 * Rebuilds the internal router after routes have been added or
	 * removed (e.g. by the dev server on HMR).
	 */
	rebuildRouter() {
		this.#router = new Router(this.manifestData.routes, {
			base: this.manifest.base,
			trailingSlash: this.manifest.trailingSlash,
			buildFormat: this.manifest.buildFormat,
		});
	}
	/**
	 * Resolves the middleware from the manifest, and returns the `onRequest` function. If `onRequest` isn't there,
	 * it returns a no-op function
	 */
	async getMiddleware() {
		if (this.resolvedMiddleware) {
			return this.resolvedMiddleware;
		}
		if (this.middleware) {
			const middlewareInstance = await this.middleware();
			const onRequest = middlewareInstance.onRequest ?? NOOP_MIDDLEWARE_FN;
			const internalMiddlewares = [onRequest];
			if (this.manifest.checkOrigin) {
				internalMiddlewares.unshift(createOriginCheckMiddleware());
			}
			this.resolvedMiddleware = sequence(...internalMiddlewares);
			return this.resolvedMiddleware;
		} else {
			this.resolvedMiddleware = NOOP_MIDDLEWARE_FN;
			return this.resolvedMiddleware;
		}
	}
	/**
	 * Clears the cached middleware so it is re-resolved on the next request.
	 * Called via HMR when middleware files change during development.
	 */
	clearMiddleware() {
		this.resolvedMiddleware = void 0;
	}
	/**
	 * Resolves the logger destination from the manifest and updates the pipeline logger.
	 * If the user configured `experimental.logger`, the bundled logger factory is loaded
	 * and replaces the default console destination. This is lazy and only resolves once.
	 */
	async getLogger() {
		if (this.resolvedLogger) {
			return this.logger;
		}
		this.resolvedLogger = true;
		if (this.manifest.experimentalLogger) {
			this.logger = await loadLogger(this.manifest.experimentalLogger);
		}
		return this.logger;
	}
	async getActions() {
		if (this.resolvedActions) {
			return this.resolvedActions;
		} else if (this.actions) {
			return this.actions();
		}
		return NOOP_ACTIONS_MOD;
	}
	async getSessionDriver() {
		if (this.resolvedSessionDriver !== void 0) {
			return this.resolvedSessionDriver;
		}
		if (this.sessionDriver) {
			const driverModule = await this.sessionDriver();
			this.resolvedSessionDriver = driverModule?.default || null;
			return this.resolvedSessionDriver;
		}
		this.resolvedSessionDriver = null;
		return null;
	}
	async getCacheProvider() {
		if (this.resolvedCacheProvider !== void 0) {
			return this.resolvedCacheProvider;
		}
		if (this.cacheProvider) {
			const mod = await this.cacheProvider();
			const factory = mod?.default || null;
			this.resolvedCacheProvider = factory ? factory(this.cacheConfig?.options) : null;
			return this.resolvedCacheProvider;
		}
		this.resolvedCacheProvider = null;
		return null;
	}
	async getServerIslands() {
		if (this.serverIslands) {
			return this.serverIslands();
		}
		return {
			serverIslandMap: /* @__PURE__ */ new Map(),
			serverIslandNameMap: /* @__PURE__ */ new Map(),
		};
	}
	async getAction(path) {
		const pathKeys = path.split('.').map((key) => decodeURIComponent(key));
		let { server } = await this.getActions();
		if (!server || !(typeof server === 'object')) {
			throw new TypeError(
				`Expected \`server\` export in actions file to be an object. Received ${typeof server}.`,
			);
		}
		for (const key of pathKeys) {
			if (FORBIDDEN_PATH_KEYS.has(key)) {
				throw new AstroError({
					...ActionNotFoundError,
					message: ActionNotFoundError.message(pathKeys.join('.')),
				});
			}
			if (!Object.hasOwn(server, key)) {
				throw new AstroError({
					...ActionNotFoundError,
					message: ActionNotFoundError.message(pathKeys.join('.')),
				});
			}
			server = server[key];
		}
		if (typeof server !== 'function') {
			throw new TypeError(
				`Expected handler for action ${pathKeys.join('.')} to be a function. Received ${typeof server}.`,
			);
		}
		return server;
	}
	async getModuleForRoute(route) {
		for (const defaultRoute of this.defaultRoutes) {
			if (route.component === defaultRoute.component) {
				return {
					page: () => Promise.resolve(defaultRoute.instance),
				};
			}
		}
		if (route.type === 'redirect') {
			return RedirectSinglePageBuiltModule;
		} else {
			if (this.manifest.pageMap) {
				const importComponentInstance = this.manifest.pageMap.get(route.component);
				if (!importComponentInstance) {
					throw new Error(
						`Unexpectedly unable to find a component instance for route ${route.route}`,
					);
				}
				return await importComponentInstance();
			} else if (this.manifest.pageModule) {
				return this.manifest.pageModule;
			}
			throw new Error(
				"Astro couldn't find the correct page to render, probably because it wasn't correctly mapped for SSR usage. This is an internal error, please file an issue.",
			);
		}
	}
	createNodePool(poolSize, stats) {
		return new NodePool(poolSize, stats);
	}
	createStringCache() {
		return new HTMLStringCache(1e3);
	}
}
export { Pipeline, PipelineFeatures };

import type { $ZodType } from 'zod/v4/core';
import type { ActionAccept, ActionClient } from '../actions/runtime/types.js';
import type { ComponentInstance } from '../types/astro.js';
import type { MiddlewareHandler, RewritePayload } from '../types/public/common.js';
import type { RuntimeMode } from '../types/public/config.js';
import type {
	RouteData,
	SSRActions,
	SSRLoadedRenderer,
	SSRManifest,
	SSRResult,
} from '../types/public/internal.js';
import type { ServerIslandMappings } from './app/types.js';
import type { SinglePageBuiltModule } from './build/types.js';
import type { AstroLogger } from './logger/core.js';
import { RouteCache } from './render/route-cache.js';
import { type DefaultRouteParams } from './routing/default.js';
import type { CacheProvider, CacheProviderFactory } from './cache/types.js';
import type { CompiledCacheRoute } from './cache/runtime/route-matching.js';
import type { SessionDriverFactory } from './session/types.js';
import { NodePool } from '../runtime/server/render/queue/pool.js';
import { HTMLStringCache } from '../runtime/server/html-string-cache.js';
/**
 * Bit flags for pipeline features that handler classes register as
 * "used" when a custom `src/app.ts` fetch handler is in play. After the
 * first request (dev) or at runtime (prod SSR), we compare against the
 * manifest to warn about features the user configured but forgot to
 * include in their custom pipeline.
 */
export declare const PipelineFeatures: {
	readonly redirects: number;
	readonly sessions: number;
	readonly actions: number;
	readonly middleware: number;
	readonly i18n: number;
	readonly cache: number;
};
/**
 * The `Pipeline` represents the static parts of rendering that do not change between requests.
 * These are mostly known when the server first starts up and do not change.
 *
 * Thus, a `Pipeline` is created once at process start and then used by every `FetchState`.
 */
export declare abstract class Pipeline {
	#private;
	readonly internalMiddleware: MiddlewareHandler[];
	resolvedMiddleware: MiddlewareHandler | undefined;
	resolvedLogger: boolean;
	resolvedActions: SSRActions | undefined;
	resolvedSessionDriver: SessionDriverFactory | null | undefined;
	resolvedCacheProvider: CacheProvider | null | undefined;
	compiledCacheRoutes: CompiledCacheRoute[] | undefined;
	nodePool: NodePool | undefined;
	htmlStringCache: HTMLStringCache | undefined;
	/**
	 * Bit mask of pipeline features activated by handler classes.
	 * Each handler sets its bit via `|=`. Only meaningful when a
	 * custom `src/app.ts` fetch handler is in use.
	 */
	usedFeatures: number;
	logger: AstroLogger;
	readonly manifest: SSRManifest;
	/**
	 * "development" or "production" only
	 */
	readonly runtimeMode: RuntimeMode;
	readonly renderers: SSRLoadedRenderer[];
	readonly resolve: (s: string) => Promise<string>;
	readonly streaming: boolean;
	/**
	 * Used to provide better error messages for `Astro.clientAddress`
	 */
	readonly adapterName: SSRManifest['adapterName'];
	readonly clientDirectives: SSRManifest['clientDirectives'];
	readonly inlinedScripts: SSRManifest['inlinedScripts'];
	readonly compressHTML: SSRManifest['compressHTML'];
	readonly i18n: SSRManifest['i18n'];
	readonly middleware: SSRManifest['middleware'];
	readonly routeCache: RouteCache;
	/**
	 * Used for `Astro.site`.
	 */
	readonly site: URL | undefined;
	/**
	 * Array of built-in, internal, routes.
	 * Used to find the route module
	 */
	readonly defaultRoutes: Array<DefaultRouteParams>;
	readonly actions: SSRManifest['actions'];
	readonly sessionDriver: SSRManifest['sessionDriver'];
	readonly cacheProvider: SSRManifest['cacheProvider'];
	readonly cacheConfig: SSRManifest['cacheConfig'];
	readonly serverIslands: SSRManifest['serverIslandMappings'];
	/** Route data derived from the manifest, used for route matching. */
	manifestData: {
		routes: RouteData[];
	};
	constructor(
		logger: AstroLogger,
		manifest: SSRManifest,
		/**
		 * "development" or "production" only
		 */
		runtimeMode: RuntimeMode,
		renderers: SSRLoadedRenderer[],
		resolve: (s: string) => Promise<string>,
		streaming: boolean,
		/**
		 * Used to provide better error messages for `Astro.clientAddress`
		 */
		adapterName?: string,
		clientDirectives?: Map<string, string>,
		inlinedScripts?: Map<string, string>,
		compressHTML?: boolean | 'jsx',
		i18n?: import('./app/types.js').SSRManifestI18n | undefined,
		middleware?:
			| (() =>
					| Promise<import('../types/public/common.js').AstroMiddlewareInstance>
					| import('../types/public/common.js').AstroMiddlewareInstance)
			| undefined,
		routeCache?: RouteCache,
		/**
		 * Used for `Astro.site`.
		 */
		site?: URL | undefined,
		/**
		 * Array of built-in, internal, routes.
		 * Used to find the route module
		 */
		defaultRoutes?: DefaultRouteParams[],
		actions?: (() => Promise<SSRActions> | SSRActions) | undefined,
		sessionDriver?:
			| (() => Promise<{
					default: SessionDriverFactory | null;
			  }>)
			| undefined,
		cacheProvider?:
			| (() => Promise<{
					default: CacheProviderFactory | null;
			  }>)
			| undefined,
		cacheConfig?: import('./cache/types.js').SSRManifestCache | undefined,
		serverIslands?: (() => Promise<ServerIslandMappings> | ServerIslandMappings) | undefined,
	);
	/**
	 * Low-level route matching against the manifest routes. Returns the
	 * matched `RouteData` or `undefined`. Does not filter prerendered
	 * routes or check public assets — use `BaseApp.match()` for that.
	 */
	matchRoute(pathname: string): RouteData | undefined;
	/**
	 * Rebuilds the internal router after routes have been added or
	 * removed (e.g. by the dev server on HMR).
	 */
	rebuildRouter(): void;
	abstract headElements(routeData: RouteData): Promise<HeadElements> | HeadElements;
	abstract componentMetadata(routeData: RouteData): Promise<SSRResult['componentMetadata']> | void;
	/**
	 * It attempts to retrieve the `RouteData` that matches the input `url`, and the component that belongs to the `RouteData`.
	 *
	 * ## Errors
	 *
	 * - if not `RouteData` is found
	 *
	 * @param {RewritePayload} rewritePayload The payload provided by the user
	 * @param {Request} request The original request
	 */
	abstract tryRewrite(rewritePayload: RewritePayload, request: Request): Promise<TryRewriteResult>;
	/**
	 * Tells the pipeline how to retrieve a component give a `RouteData`
	 * @param routeData
	 */
	abstract getComponentByRoute(routeData: RouteData): Promise<ComponentInstance>;
	/**
	 * The current name of the pipeline. Useful for debugging
	 */
	abstract getName(): string;
	/**
	 * Resolves the middleware from the manifest, and returns the `onRequest` function. If `onRequest` isn't there,
	 * it returns a no-op function
	 */
	getMiddleware(): Promise<MiddlewareHandler>;
	/**
	 * Clears the cached middleware so it is re-resolved on the next request.
	 * Called via HMR when middleware files change during development.
	 */
	clearMiddleware(): void;
	/**
	 * Resolves the logger destination from the manifest and updates the pipeline logger.
	 * If the user configured `experimental.logger`, the bundled logger factory is loaded
	 * and replaces the default console destination. This is lazy and only resolves once.
	 */
	getLogger(): Promise<AstroLogger>;
	getActions(): Promise<SSRActions>;
	getSessionDriver(): Promise<SessionDriverFactory | null>;
	getCacheProvider(): Promise<CacheProvider | null>;
	getServerIslands(): Promise<ServerIslandMappings>;
	getAction(path: string): Promise<ActionClient<unknown, ActionAccept, $ZodType>>;
	getModuleForRoute(route: RouteData): Promise<SinglePageBuiltModule>;
	createNodePool(poolSize: number, stats: boolean): NodePool;
	createStringCache(): HTMLStringCache;
}
export interface HeadElements extends Pick<SSRResult, 'scripts' | 'styles' | 'links'> {}
export interface TryRewriteResult {
	routeData: RouteData;
	componentInstance: ComponentInstance;
	newUrl: URL;
	pathname: string;
}

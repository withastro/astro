import type { MiddlewareHandler, RuntimeMode, SSRLoadedRenderer, SSRManifest } from '../../@types/astro.js';
import type { Logger } from '../logger/core.js';
import type { RouteCache } from './route-cache.js';
import { Pipeline } from '../pipeline.js';
import type { RenderContext } from './context.js';
import { createI18nMiddleware } from '../../i18n/middleware.js';
import { sequence } from '../middleware/index.js';

/**
 * The environment represents the static parts of rendering that do not change between requests.
 * These are mostly known when the server first starts up and do not change.
 * Thus, an environment is created once at process start and then used by every pipeline.
 */
export abstract class Environment {
	readonly internalMiddleware: MiddlewareHandler;

	constructor(
		readonly logger: Logger,
		readonly manifest: SSRManifest,
		/**
		 * "development" or "production"
		 */
		readonly mode: RuntimeMode,
		public renderers: SSRLoadedRenderer[],
		readonly resolve: (s: string) => Promise<string>,
		/**
		 * Based on Astro config's `output` option, `true` if "server" or "hybrid".
		 */
		readonly serverLike: boolean,
		readonly streaming: boolean,
		readonly routeCache: RouteCache,
		/**
		 * Used to provide better error messages for `Astro.clientAddress`
		 */
		readonly adapterName = manifest.adapterName,
		readonly clientDirectives = manifest.clientDirectives,
		readonly compressHTML = manifest.compressHTML,
		readonly i18n = manifest.i18n,
		readonly middleware = manifest.middleware,
		/**
		 * Used for `Astro.site`.
		 */
		readonly site = manifest.site,
	) {
		this.internalMiddleware = createI18nMiddleware(i18n, manifest.base, manifest.trailingSlash, manifest.buildFormat);
	}

	createPipeline({ renderContext, pathname, middleware }: { pathname: string; renderContext: RenderContext; middleware?: MiddlewareHandler }) {
		return new Pipeline(this, renderContext.locals ?? {}, renderContext.request, pathname, renderContext, sequence(this.internalMiddleware, middleware ?? this.middleware));
	}
}

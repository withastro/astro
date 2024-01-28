import type { ComponentInstance, EndpointHandler, MiddlewareHandler, RuntimeMode, SSRLoadedRenderer, SSRManifest } from '../../@types/astro.js';
import { callEndpoint, createAPIContext } from '../endpoint/index.js';
import type { Logger } from '../logger/core.js';
import { callMiddleware } from '../middleware/callMiddleware.js';
import type { RenderContext } from './context.js';
import { renderPage } from './core.js';
import type { RouteCache } from './route-cache.js';

type PipelineHooks = {
	before: PipelineHookFunction[];
};

export type PipelineHookFunction = (ctx: RenderContext, mod: ComponentInstance | undefined) => void;

/**
 * The environment represents the static parts of rendering that do not change between requests.
 * These are mostly known when the server first starts up and do not change.
 * Thus, an environment is created once at process start and then used by every pipeline.
 */
export class Environment {
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
		private middleware = manifest.middleware,
		/**
		 * Used for `Astro.site`.
		 */
		readonly site = manifest.site,
	) {}

	#hooks: PipelineHooks = {
		before: [],
	};

	/**
	 * A middleware function that will be called before each request.
	 */
	setMiddlewareFunction(onRequest: MiddlewareHandler) {
		this.middleware = onRequest;
	}

	/**
	 * Removes the current middleware function. Subsequent requests won't trigger any middleware.
	 */
	unsetMiddlewareFunction() {
		this.middleware = (_, next) => next();
	}
	
	/**
	 * Returns the current environment
	 */
	getEnvironment(): Readonly<Environment> {
		return this;
	}

	/**
	 * The main function of the pipeline. Use this function to render any route known to Astro;
	 */
	async renderRoute(
		renderContext: RenderContext,
		componentInstance: ComponentInstance | undefined
	): Promise<Response> {
		for (const hook of this.#hooks.before) {
			hook(renderContext, componentInstance);
		}
		return await this.#tryRenderRoute(renderContext, componentInstance);
	}

	/**
	 * It attempts to render a route. A route can be a:
	 * - page
	 * - redirect
	 * - endpoint
	 *
	 * ## Errors
	 *
	 * It throws an error if the page can't be rendered.
	 */
	async #tryRenderRoute(
		renderContext: Readonly<RenderContext>,
		mod: Readonly<ComponentInstance> | undefined,
	): Promise<Response> {
		const apiContext = createAPIContext({
			request: renderContext.request,
			params: renderContext.params,
			props: renderContext.props,
			site: this.site,
			adapterName: this.adapterName,
			locales: renderContext.locales,
			routingStrategy: renderContext.routing,
			defaultLocale: renderContext.defaultLocale,
		});

		switch (renderContext.route.type) {
			case 'page':
			case 'fallback':
			case 'redirect': {
				return await callMiddleware(this.middleware, apiContext, () => {
					return renderPage({
						mod,
						renderContext,
						env: this,
						cookies: apiContext.cookies,
					});
				});
			}
			case 'endpoint': {
				return await callEndpoint(mod as any as EndpointHandler, this, renderContext, this.middleware);
			}
			default:
				throw new Error(`Couldn't find route of type [${renderContext.route.type}]`);
		}
	}

	/**
	 * Store a function that will be called before starting the rendering phase.
	 * @param fn
	 */
	onBeforeRenderRoute(fn: PipelineHookFunction) {
		this.#hooks.before.push(fn);
	}
}

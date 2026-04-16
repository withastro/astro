import {
	REROUTABLE_STATUS_CODES,
	REROUTE_DIRECTIVE_HEADER,
	REWRITE_DIRECTIVE_HEADER_KEY,
} from '../constants.js';
import { ActionHandler } from '../../actions/handler.js';
import { TrailingSlashHandler } from './trailing-slash-handler.js';
import { type CacheLike, applyCacheHeaders } from '../cache/runtime/cache.js';
import { AstroMiddleware } from '../middleware/astro-middleware.js';
import { type AstroSession, PERSIST_SYMBOL } from '../session/runtime.js';
import { FetchState } from '../app/fetch-state.js';
import { getRenderOptions } from '../app/render-options.js';
import { prepareResponse } from '../app/prepare-response.js';
import type { BaseApp, ResolvedRenderOptions } from '../app/base.js';

export class AstroHandler {
	#app: BaseApp<any>;
	#trailingSlashHandler: TrailingSlashHandler;
	#astroMiddleware: AstroMiddleware;
	#actionHandler: ActionHandler;

	constructor(app: BaseApp<any>) {
		this.#app = app;
		this.#trailingSlashHandler = new TrailingSlashHandler(app);
		this.#astroMiddleware = new AstroMiddleware(app.pipeline);
		this.#actionHandler = new ActionHandler();
	}

	async handle(request: Request): Promise<Response> {
		const trailingSlashRedirect = this.#trailingSlashHandler.handle(request);
		if (trailingSlashRedirect) {
			return trailingSlashRedirect;
		}

		const options = getRenderOptions(request);
		const addCookieHeader = options?.addCookieHeader ?? false;
		const clientAddress = options?.clientAddress;
		const locals = options?.locals;
		const prerenderedErrorPageFetch = options?.prerenderedErrorPageFetch ?? fetch;

		const timeStart = performance.now();

		const state = new FetchState(this.#app, request);

		const resolvedRenderOptions: ResolvedRenderOptions = {
			addCookieHeader,
			clientAddress,
			prerenderedErrorPageFetch,
			locals,
			routeData: state.routeData,
		};

		if (!(await state.validateRouteData())) {
			return this.#app.renderError(request, {
				...resolvedRenderOptions,
				status: 404,
				pathname: state.pathname,
			});
		}
		const routeData = state.routeData!;
		const pathname = state.pathname;
		const defaultStatus = this.#app.getDefaultStatusCode(routeData, pathname);

		let response;
		let session: AstroSession | undefined;
		let cache: CacheLike | undefined;
		try {
			// Load route module. We also catch its error here if it fails on initialization
			const componentInstance = await this.#app.pipeline.getComponentByRoute(routeData);
			const renderContext = await this.#app.createRenderContext({
				pipeline: this.#app.pipeline,
				locals,
				pathname,
				request,
				routeData,
				status: defaultStatus,
				clientAddress,
			});
			session = renderContext.session;
			cache = renderContext.cache;

			// Handle Astro Action requests (RPC + form).
			// - RPC: returns a serialized action result and short-circuits rendering.
			// - Form: runs the action, stashes the result in `locals._actionPayload`,
			//   and falls through to render the page normally.
			const actionResponse = await this.#actionHandler.handle(renderContext);
			if (actionResponse) {
				this.#app.logThisRequest({
					pathname,
					method: request.method,
					statusCode: actionResponse.status,
					isRewrite: false,
					timeStart,
				});
				prepareResponse(actionResponse, { addCookieHeader });
				return actionResponse;
			}

			if (this.#app.pipeline.cacheProvider) {
				// If the cache provider has an onRequest handler (runtime caching),
				// wrap the render call so the provider can serve from cache
				const cacheProvider = await this.#app.pipeline.getCacheProvider();
				if (cacheProvider?.onRequest) {
					response = await cacheProvider.onRequest(
						{
							request,
							url: new URL(request.url),
						},
						async () => {
							const res = await this.#astroMiddleware.handle(renderContext, componentInstance);
							// Apply cache headers before the provider reads them
							applyCacheHeaders(cache!, res);
							return res;
						},
					);
					// Strip CDN headers after the runtime provider has read them
					response.headers.delete('CDN-Cache-Control');
					response.headers.delete('Cache-Tag');
				} else {
					response = await this.#astroMiddleware.handle(renderContext, componentInstance);
					// Apply cache headers for CDN-based providers (no onRequest)
					applyCacheHeaders(cache!, response);
				}
			} else {
				response = await this.#astroMiddleware.handle(renderContext, componentInstance);
			}

			const isRewrite = response.headers.has(REWRITE_DIRECTIVE_HEADER_KEY);

			this.#app.logThisRequest({
				pathname,
				method: request.method,
				statusCode: response.status,
				isRewrite,
				timeStart,
			});
		} catch (err: any) {
			this.#app.logger.error(null, err.stack || err.message || String(err));
			return this.#app.renderError(request, {
				...resolvedRenderOptions,
				status: 500,
				error: err,
				pathname: state.pathname,
			});
		} finally {
			await session?.[PERSIST_SYMBOL]();
		}

		if (
			REROUTABLE_STATUS_CODES.includes(response.status) &&
			// If the body isn't null, that means the user sets the 404 status
			// but uses the current route to handle the 404
			response.body === null &&
			response.headers.get(REROUTE_DIRECTIVE_HEADER) !== 'no'
		) {
			return this.#app.renderError(request, {
				...resolvedRenderOptions,
				response,
				status: response.status as 404 | 500,
				// We don't have an error to report here. Passing null means we pass nothing intentionally
				// while undefined means there's no error
				error: response.status === 500 ? null : undefined,
				pathname: state.pathname,
			});
		}

		prepareResponse(response, { addCookieHeader });
		return response;
	}
}

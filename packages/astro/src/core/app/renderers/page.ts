import type { RouteData } from '../../../types/public/internal.js';
import type { SSRManifest } from '../../../types/public/index.js';
import type { Pipeline } from '../../base-pipeline.js';
import type { Logger } from '../../logger/core.js';
import type { RoutesList } from '../../../types/astro.js';
import { prepareForRender, type PrepareOptions } from '../prepare.js';
import { createSSRResult } from '../ssr-result.js';
import { renderPage } from '../../../runtime/server/render/page.js';
import { getProps } from '../../render/index.js';
import { ROUTE_TYPE_HEADER, REROUTE_DIRECTIVE_HEADER, originPathnameSymbol } from '../../constants.js';
import { ForbiddenRewrite } from '../../errors/errors-data.js';
import { AstroError } from '../../errors/index.js';

/**
 * Renders page routes. This class is framework-agnostic and does not
 * depend on Hono APIs; callers provide a Request and render options.
 */
export class PageRenderer {
	#pipeline: Pipeline;
	#manifest: SSRManifest;
	#getManifestData: () => RoutesList;
	#logger: Logger;

	constructor(pipeline: Pipeline, manifest: SSRManifest, getManifestData: () => RoutesList, logger: Logger) {
		this.#pipeline = pipeline;
		this.#manifest = manifest;
		this.#getManifestData = getManifestData;
		this.#logger = logger;
	}

	render(request: Request, routeData: RouteData, options: PrepareOptions = {}): Promise<Response> {
		return prepareForRender(
			this.#pipeline,
			this.#manifest,
			this.#getManifestData(),
			this.#logger,
			request,
			routeData,
			options,
			async (renderContext, componentInstance) => {
				const { pipeline } = renderContext;
				const props =
					Object.keys(renderContext.props).length > 0
						? renderContext.props
						: await getProps({
								mod: componentInstance,
								routeData: renderContext.routeData,
								routeCache: pipeline.routeCache,
								pathname: renderContext.pathname,
								logger: pipeline.logger,
								serverLike: pipeline.manifest.serverLike,
								base: pipeline.manifest.base,
								trailingSlash: pipeline.manifest.trailingSlash,
							});

				const manifest = this.#manifest;
				const getManifestData = this.#getManifestData;
				const logger = this.#logger;

				const result = await createSSRResult({
					pipeline,
					routeData: renderContext.routeData,
					mod: componentInstance,
					request: renderContext.request,
					pathname: renderContext.pathname,
					params: renderContext.params,
					status: renderContext.status,
					locals: renderContext.locals,
					cookies: renderContext.cookies,
					url: renderContext.url,
					clientAddress: renderContext.clientAddress,
					session: renderContext.session,
					cache: renderContext.cache,
					shouldInjectCspMetaTags: renderContext.shouldInjectCspMetaTags,
					serverIslandNameMap: renderContext.serverIslands.serverIslandNameMap ?? new Map(),
					partial: renderContext.partial,
					async rewrite(rewritePayload) {
						const { routeData: rewriteRouteData, pathname: rewritePathname, newUrl } =
							await pipeline.tryRewrite(rewritePayload, renderContext.request);
						// Forbid SSR → prerendered rewrites in server mode
						if (
							pipeline.manifest.serverLike === true &&
							!renderContext.routeData.prerender &&
							rewriteRouteData.prerender === true
						) {
							throw new AstroError({
								...ForbiddenRewrite,
								message: ForbiddenRewrite.message(
									renderContext.pathname,
									rewritePathname,
									rewriteRouteData.component,
								),
								hint: ForbiddenRewrite.hint(rewriteRouteData.component),
							});
						}
						const newRequest = rewritePayload instanceof Request
							? rewritePayload
							: new Request(newUrl, renderContext.request);
						// Preserve the original request's origin pathname across the rewrite
						const origin = Reflect.get(renderContext.request, originPathnameSymbol);
						if (origin) {
							Reflect.set(newRequest, originPathnameSymbol, origin);
						}
						// Merge cookies set during this render into the rewrite request.
						for (const setCookieValue of renderContext.cookies.headers()) {
							newRequest.headers.append('cookie', setCookieValue.split(';')[0]);
						}
						return prepareForRender(
							pipeline, manifest, getManifestData(), logger,
							newRequest, rewriteRouteData,
							{ locals: renderContext.locals, cookies: renderContext.cookies },
							(ctx, comp) => ctx.render(comp),
						);
					},
				});

				try {
					const response = await renderPage(
						result,
						componentInstance?.default as any,
						props,
						{},
						pipeline.streaming,
						renderContext.routeData,
					);

					response.headers.set(ROUTE_TYPE_HEADER, 'page');
					if (renderContext.routeData.route === '/404' || renderContext.routeData.route === '/500') {
						response.headers.set(REROUTE_DIRECTIVE_HEADER, 'no');
					}

					return response;
				} catch (e) {
					result.cancelled = true;
					throw e;
				}
			},
		);
	}
}

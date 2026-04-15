import type { RouteData } from '../../../types/public/internal.js';
import type { Pipeline } from '../../base-pipeline.js';
import type { AstroLogger } from '../../logger/core.js';
import type { APIContext } from '../../../types/public/context.js';
import { renderEndpoint } from '../../../runtime/server/endpoint.js';
import { getProps } from '../../render/params-and-props.js';
import { isAstroError } from '../../errors/index.js';
import { NoMatchingStaticPathFound } from '../../errors/errors-data.js';
import { removeBase } from '@astrojs/internal-helpers/path';

/**
 * Renders endpoint routes. This class is framework-agnostic and does not
 * depend on Hono APIs; callers provide a Request, APIContext, and route data.
 */
export class EndpointRenderer {
	#pipeline: Pipeline;
	#logger: AstroLogger;

	constructor(pipeline: Pipeline, logger: AstroLogger) {
		this.#pipeline = pipeline;
		this.#logger = logger;
	}

	async render(routeData: RouteData, apiContext: APIContext): Promise<Response> {
		const componentInstance = await this.#pipeline.getComponentByRoute(routeData);
		// For prerendered endpoints with getStaticPaths, run getProps to:
		// 1. Validate the params match a static path (NoMatchingStaticPathFound → 404)
		// 2. Detect dynamic endpoint path collisions (PrerenderDynamicEndpointPathCollide)
		if (routeData.prerender && componentInstance.getStaticPaths) {
			try {
				// Strip the base and decode URI — route patterns and getStaticPaths
				// keys don't include the base, and params use decoded values.
				const pathname = removeBase(decodeURI(apiContext.url.pathname), this.#pipeline.manifest.base);
				await getProps({
					mod: componentInstance as any,
					routeData,
					routeCache: this.#pipeline.routeCache,
					pathname,
					logger: this.#logger,
					serverLike: this.#pipeline.manifest.serverLike,
					base: this.#pipeline.manifest.base,
					trailingSlash: this.#pipeline.manifest.trailingSlash,
				});
			} catch (err: any) {
				// Params not in getStaticPaths → 404
				if (isAstroError(err) && err.title === NoMatchingStaticPathFound.title) {
					return new Response(null, { status: 404 });
				}
				throw err;
			}
		}
		return renderEndpoint(
			componentInstance as any,
			apiContext,
			routeData.prerender,
			this.#logger,
		);
	}
}

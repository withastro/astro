import type { RouteData } from '../../../types/public/internal.js';
import type { SSRManifest } from '../../../types/public/index.js';
import type { Pipeline } from '../../base-pipeline.js';
import type { AstroLogger } from '../../logger/core.js';
import type { RoutesList } from '../../../types/astro.js';
import { prepareRenderContext, finalizeRender, renderErrorPage, type PrepareOptions } from '../../app/prepare.js';
import { isAstroError } from '../../errors/index.js';
import { NoMatchingStaticPathFound } from '../../errors/errors-data.js';
import { getRenderOptions } from '../../app/render-options-store.js';
import { matchRoute } from '../../routing/match.js';
import { PERSIST_SYMBOL } from '../../session/runtime.js';

/**
 * Renders page routes. This class is framework-agnostic and does not
 * depend on Hono APIs; callers provide a Request and render options.
 */
export class PageRenderer {
	#pipeline: Pipeline;
	#manifest: SSRManifest;
	#logger: AstroLogger;

	constructor(pipeline: Pipeline, manifest: SSRManifest, _getManifestData: () => RoutesList, logger: AstroLogger) {
		this.#pipeline = pipeline;
		this.#manifest = manifest;
		this.#logger = logger;
	}

	async render(request: Request, routeData: RouteData, options: PrepareOptions = {}): Promise<Response> {
		const pipeline = this.#pipeline;
		const manifest = this.#manifest;
		const logger = this.#logger;
		const isDev = options.isDev ?? (pipeline.runtimeMode === 'development');
		const {
			clientAddress,
			locals,
			prerenderedErrorPageFetch = getRenderOptions(request)?.prerenderedErrorPageFetch ?? fetch,
		} = options;

		const prepared = await prepareRenderContext(pipeline, manifest, logger, request, routeData, options);
		const { renderContext, componentInstance, session } = prepared;

		let response: Response;
		try {
			response = await renderContext.render(componentInstance);
		} catch (err: any) {
			// A getStaticPaths route matched the pattern but the specific params
			// aren't in the static paths list. Treat this as a 404, not a 500.
			if (isAstroError(err) && err.title === NoMatchingStaticPathFound.title) {
				logger.warn('router', err.message);
				return renderErrorPage(pipeline, manifest, pipeline.manifestData, logger, request, {
					clientAddress,
					locals,
					prerenderedErrorPageFetch,
					isDev,
					status: 404,
					error: err,
				});
			}
			logger.error(null, err.stack || err.message || String(err));
			// In dev, re-throw so the error reaches the Vite error overlay
			// unless there's a custom 500 page.
			if (isDev) {
				const errorRoutePath = `/500${manifest.trailingSlash === 'always' ? '/' : ''}`;
				const custom500 = matchRoute(errorRoutePath, pipeline.manifestData);
				if (!custom500) throw err;
			}
			return renderErrorPage(pipeline, manifest, pipeline.manifestData, logger, request, {
				clientAddress,
				locals,
				prerenderedErrorPageFetch,
				isDev,
				status: 500,
				error: err,
			});
		} finally {
			await session?.[PERSIST_SYMBOL]();
		}

		return finalizeRender(pipeline, manifest, logger, request, response, prepared, options);
	}
}

import type { RouteData } from '../../../types/public/index.js';
import { DevErrorHandler } from '../../errors/dev-handler.js';
import type { ErrorHandler } from '../../errors/handler.js';
import type { AstroLogger } from '../../logger/core.js';
import { BaseApp, type DevMatch, type LogRequestPayload } from '../base.js';
import type { SSRManifest } from '../types.js';
import { NonRunnablePipeline } from './pipeline.js';
import { ensure404Route } from '../../routing/astro-designed-error-pages.js';
import { matchRoute } from '../../routing/dev.js';
import type { RunnablePipeline } from '../../../vite-plugin-app/pipeline.js';
import type { RoutesList } from '../../../types/astro.js';
import { req } from '../../messages/runtime.js';

export class DevApp extends BaseApp<NonRunnablePipeline> {
	constructor(manifest: SSRManifest, streaming = true, logger: AstroLogger) {
		super(manifest, streaming, logger);
	}

	createPipeline(
		streaming: boolean,
		manifest: SSRManifest,
		logger: AstroLogger,
	): NonRunnablePipeline {
		return NonRunnablePipeline.create({
			logger,
			manifest,
			streaming,
		});
	}

	isDev(): boolean {
		return true;
	}

	/**
	 * Clears the cached middleware so it is re-resolved on the next request.
	 * Called via HMR when middleware files change.
	 */
	clearMiddleware(): void {
		this.pipeline.clearMiddleware();
	}

	/**
	 * Updates the routes list when files change during development.
	 * Called via HMR when new pages are added/removed.
	 */
	updateRoutes(newRoutesList: RoutesList): void {
		this.manifestData = newRoutesList;
		ensure404Route(this.manifestData);
	}

	match(request: Request): RouteData | undefined {
		return super.match(request, true);
	}

	async devMatch(pathname: string): Promise<DevMatch | undefined> {
		const matchedRoute = await matchRoute(
			pathname,
			this.manifestData,
			this.pipeline as unknown as RunnablePipeline,
			this.manifest,
		);
		if (!matchedRoute) return undefined;

		return {
			routeData: matchedRoute.route,
			resolvedPathname: matchedRoute.resolvedPathname,
		};
	}

	protected createErrorHandler(): ErrorHandler {
		return new DevErrorHandler(this, { shouldInjectCspMetaTags: false });
	}

	logRequest({ pathname, method, statusCode, isRewrite, reqTime }: LogRequestPayload) {
		if (pathname === '/favicon.ico') {
			return;
		}
		this.logger.info(
			null,
			req({
				url: pathname,
				method,
				statusCode,
				isRewrite,
				reqTime,
			}),
		);
	}
}

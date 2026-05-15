import { DevErrorHandler } from '../../errors/dev-handler.js';
import { BaseApp } from '../base.js';
import { NonRunnablePipeline } from './pipeline.js';
import { ensure404Route } from '../../routing/astro-designed-error-pages.js';
import { matchRoute } from '../../routing/dev.js';
import { req } from '../../messages/runtime.js';
class DevApp extends BaseApp {
	constructor(manifest, streaming = true, logger) {
		super(manifest, streaming, logger);
	}
	createPipeline(streaming, manifest, logger) {
		return NonRunnablePipeline.create({
			logger,
			manifest,
			streaming,
		});
	}
	isDev() {
		return true;
	}
	/**
	 * Clears the cached middleware so it is re-resolved on the next request.
	 * Called via HMR when middleware files change.
	 */
	clearMiddleware() {
		this.pipeline.clearMiddleware();
	}
	/**
	 * Updates the routes list when files change during development.
	 * Called via HMR when new pages are added/removed.
	 */
	updateRoutes(newRoutesList) {
		this.manifestData = newRoutesList;
		ensure404Route(this.manifestData);
	}
	match(request) {
		return super.match(request, true);
	}
	async devMatch(pathname) {
		const matchedRoute = await matchRoute(
			pathname,
			this.manifestData,
			this.pipeline,
			this.manifest,
		);
		if (!matchedRoute) return void 0;
		return {
			routeData: matchedRoute.route,
			resolvedPathname: matchedRoute.resolvedPathname,
		};
	}
	createErrorHandler() {
		return new DevErrorHandler(this, { shouldInjectCspMetaTags: false });
	}
	logRequest({ pathname, method, statusCode, isRewrite, reqTime }) {
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
export { DevApp };

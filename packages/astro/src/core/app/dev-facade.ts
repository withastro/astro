import type { RouteData } from '../../types/public/index.js';
import { req } from '../messages/runtime.js';
import { matchRoute as devMatchRoute } from '../routing/dev.js';
import { BaseApp, type DevMatch, type LogRequestPayload } from './base.js';
import type { SSRManifest } from './types.js';

/**
 * The shared thin dev facade: used by BOTH dev paths —
 * the workerd / non-runnable dev entrypoint (`entrypoints/virtual/dev.ts`)
 * and the runnable dev server (`vite-plugin-app/createAstroServerApp.ts`).
 * Everything environment-specific (module loading, error strategy, request
 * logging behavior) comes from the `RenderEnvironment` record registered on
 * the manifest before construction, and the runnable dev server's HTTP glue
 * lives in `vite-plugin-app/handle-request.ts`.
 */
export class DevFacadeApp extends BaseApp {
	constructor(manifest: SSRManifest, streaming = true) {
		super(manifest, streaming);
	}

	isDev(): boolean {
		return true;
	}

	/** Dev always allows prerendered routes to match. */
	override match(request: Request): RouteData | undefined {
		return super.match(request, true);
	}

	/**
	 * A matching route function for the development server. Contrary to
	 * `.match`, this resolves props and params, returning the correct route
	 * based on priority and segments, plus the resolved pathname.
	 */
	override async devMatch(
		pathname?: string,
		{ prerenderOnly }: { prerenderOnly?: boolean } = {},
	): Promise<DevMatch | undefined> {
		if (pathname === undefined) {
			return undefined;
		}
		const matchedRoute = await devMatchRoute(this.manifest, pathname, { prerenderOnly });
		if (!matchedRoute) {
			return undefined;
		}
		return {
			routeData: matchedRoute.route,
			resolvedPathname: matchedRoute.resolvedPathname,
		};
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

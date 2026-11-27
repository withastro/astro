import type http from 'node:http';
import { manifest } from 'virtual:astro:manifest';
import { DevFacadeApp } from '../core/app/dev-facade.js';
import type { RouteInfo } from '../internal/core/app/types.js';
import { setEnvironment } from '../internal/core/environment/index.js';
import type { AstroLogger } from '../internal/core/logger/core.js';
import { setLogger } from '../internal/core/logger/manifest-logger.js';
import { clearMiddleware } from '../internal/core/middleware/load.js';
import type { ModuleLoader } from '../internal/core/module-loader/index.js';
import { getRouteCache } from '../internal/core/render/route-cache.js';
import { updateRouteTable } from '../internal/core/routing/route-table.js';
import type { DevServerController } from '../vite-plugin-astro-server/controller.js';
import {
	createRunnableEnvironment,
	type RunnableEnvironmentOptions,
} from '../internal/vite-plugin-app/environment.js';
import { type DevRequestDeps, handleDevRequest } from './handle-request.js';

/** Options of the dev server app of a runnable server environment. */
export interface DevServerAppOptions extends Omit<RunnableEnvironmentOptions, 'loader'> {
	controller: DevServerController;
	loader: ModuleLoader;
	logger: AstroLogger;
	/** Headers added to every response. */
	serverHeaders: http.OutgoingHttpHeaders | undefined;
}

export default async function createAstroServerApp({
	controller,
	loader,
	logger: actualLogger,
	serverHeaders,
	...environmentOptions
}: DevServerAppOptions) {
	// Composition order: logger → environment → facade ctor
	// (which warms the route table from `manifest.routes` — in dev that IS the
	// live array behind `virtual:astro:routes`, so no separate routes import
	// is needed) → HMR wiring. The ModuleLoader and the options are captured
	// in the environment closure and in `deps`; they are unreachable from
	// requests/states.
	setLogger(manifest, actualLogger);
	setEnvironment(manifest, createRunnableEnvironment({ loader, ...environmentOptions }));
	const app = new DevFacadeApp(manifest, true);
	const deps: DevRequestDeps = { loader, serverHeaders, controller };

	// The HMR listeners target the MANIFEST via the functional core: one
	// atomic route-table replacement is visible to every consumer — matcher,
	// custom-404 fallback, rewrites, error-page lookups, and the
	// `manifestData` accessors — at once.
	if (import.meta.hot) {
		import.meta.hot.on('astro:routes-updated', async () => {
			try {
				// Re-import the routes module to get fresh routes
				const { routes: newRoutes } = await import('virtual:astro:routes');
				updateRouteTable(
					manifest,
					newRoutes.map((route: RouteInfo) => route.routeData),
				);
				actualLogger.debug('router', 'Routes updated via HMR');
			} catch (e: any) {
				actualLogger.error('router', `Failed to update routes via HMR:\n ${e}`);
			}
		});

		// Listen for content collection changes via HMR.
		// Clear the route cache so getStaticPaths() is re-evaluated with fresh data.
		import.meta.hot.on('astro:content-changed', () => {
			getRouteCache(manifest).clearAll();
			actualLogger.debug('router', 'Route cache cleared due to content change');
		});

		// Listen for middleware file changes via HMR.
		// Clear the cached middleware so it is re-resolved on the next request.
		import.meta.hot.on('astro:middleware-updated', () => {
			clearMiddleware(manifest);
			actualLogger.debug('router', 'Middleware cache cleared due to file change');
		});
	}

	return {
		handler(
			incomingRequest: http.IncomingMessage,
			incomingResponse: http.ServerResponse,
			options?: { prerenderOnly?: boolean },
		) {
			return handleDevRequest(app, deps, {
				incomingRequest,
				incomingResponse,
				isHttps: loader?.isHttps() ?? false,
				prerenderOnly: options?.prerenderOnly,
			});
		},
	};
}

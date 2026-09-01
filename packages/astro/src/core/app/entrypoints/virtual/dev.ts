import fetchable from 'virtual:astro:fetchable';
import { manifest } from 'virtual:astro:manifest';
import { clearActions } from '../../../../actions/load.js';
import { createNonRunnableEnvironment } from '../../../environment/dev-nonrunnable.js';
import { setEnvironment } from '../../../environment/index.js';
import { createConsoleLogger } from '../../../logger/impls/console.js';
import { getLogger, setLogger } from '../../../logger/manifest-logger.js';
import { clearMiddleware } from '../../../middleware/load.js';
import { getRouteCache } from '../../../render/route-cache.js';
import { updateRouteTable } from '../../../routing/route-table.js';
import { DevFacadeApp } from '../../dev-facade.js';
import type { CreateApp, RouteInfo } from '../../types.js';

// Prevents duplicate listener registration when `createApp` is called
// repeatedly on the same module instance. When the manifest module is
// invalidated, this whole entrypoint module re-evaluates and re-registers
// against the new manifest object (all per-manifest WeakMap state starts
// fresh).
let hmrWired = false;

export const createApp: CreateApp = ({ streaming } = {}) => {
	// Composition order: logger → environment → facade ctor
	// (which warms the route table) → fetch handler → HMR wiring.
	setLogger(manifest, createConsoleLogger({ level: manifest.logLevel }));
	setEnvironment(manifest, createNonRunnableEnvironment());
	const app = new DevFacadeApp(manifest, streaming);
	app.setFetchHandler(fetchable);

	// The HMR listeners target the MANIFEST via the functional core: one
	// atomic route-table replacement is visible to every consumer — matcher,
	// custom-404 fallback, rewrites, error-page lookups, and the
	// `manifestData` accessors — at once.
	if (import.meta.hot && !hmrWired) {
		hmrWired = true;
		import.meta.hot.on('astro:routes-updated', async () => {
			try {
				// Re-import the routes module to get fresh routes
				const { routes: newRoutes } = await import('virtual:astro:routes');
				updateRouteTable(
					manifest,
					newRoutes.map((route: RouteInfo) => route.routeData),
				);
			} catch (e: any) {
				// Log error but don't crash - route updates are non-critical
				getLogger(manifest).error('router', `Failed to update routes via HMR:\n ${e}`);
			}
		});

		// Listen for content collection changes via HMR.
		// Clear the route cache so getStaticPaths() is re-evaluated with fresh data.
		import.meta.hot.on('astro:content-changed', () => {
			getRouteCache(manifest).clearAll();
		});

		// Listen for middleware file changes via HMR.
		// Clear the cached middleware so it is re-resolved on the next request.
		import.meta.hot.on('astro:middleware-updated', () => {
			clearMiddleware(manifest);
		});

		// Listen for action file changes via HMR.
		// Clear the cached actions so they are re-resolved on the next request.
		import.meta.hot.on('astro:actions-updated', () => {
			clearActions(manifest);
		});
	}

	return app;
};

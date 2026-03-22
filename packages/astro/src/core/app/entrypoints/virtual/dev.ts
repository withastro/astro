import { manifest } from 'virtual:astro:manifest';
import { DevApp } from '../../dev/app.js';
import { createConsoleLogger } from '../../logging.js';
import type { CreateApp, RouteInfo } from '../../types.js';
import type { RoutesList } from '../../../../types/astro.js';

let currentDevApp: DevApp | null = null;

export const createApp: CreateApp = ({ streaming } = {}) => {
	const logger = createConsoleLogger(manifest.logLevel);
	currentDevApp = new DevApp(manifest, streaming, logger);

	// Listen for route updates via HMR
	if (import.meta.hot) {
		import.meta.hot.on('astro:routes-updated', async () => {
			if (!currentDevApp) return;
			try {
				// Re-import the routes module to get fresh routes
				const { routes: newRoutes } = await import('virtual:astro:routes');
				const newRoutesList: RoutesList = {
					routes: newRoutes.map((r: RouteInfo) => r.routeData),
				};
				currentDevApp.updateRoutes(newRoutesList);
			} catch (e: any) {
				// Log error but don't crash - route updates are non-critical
				logger.error('router', `Failed to update routes via HMR:\n ${e}`);
			}
		});

		// Listen for content collection changes via HMR.
		// Clear the route cache so getStaticPaths() is re-evaluated with fresh data.
		import.meta.hot.on('astro:content-changed', () => {
			if (!currentDevApp) return;
			currentDevApp.pipeline.routeCache.clearAll();
		});
	}

	return currentDevApp;
};

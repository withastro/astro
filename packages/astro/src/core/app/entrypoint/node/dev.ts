import { manifest } from 'virtual:astro:manifest';
import { DevNodeApp } from '../../dev/node.js';
import { createConsoleLogger } from '../../logging.js';
import type { RouteInfo } from '../../types.js';
import type { RoutesList } from '../../../../types/astro.js';
import type { CreateNodeApp } from '../../types.js';

let currentDevApp: DevNodeApp | null = null;

export const createNodeApp: CreateNodeApp = (streaming) => {
	const logger = createConsoleLogger(manifest.logLevel);
	currentDevApp = new DevNodeApp(manifest, streaming, logger);

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
	}

	return currentDevApp;
};

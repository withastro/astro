import { DEFAULT_404_COMPONENT } from '../constants.js';
import {
	createEndpoint as createServerIslandEndpoint,
	SERVER_ISLAND_COMPONENT,
	SERVER_ISLAND_ROUTE,
} from '../server-islands/endpoint.js';
import { DEFAULT_404_ROUTE, default404Instance } from './internal/astro-designed-error-pages.js';
const DEFAULT_COMPONENTS = [DEFAULT_404_COMPONENT, SERVER_ISLAND_COMPONENT];
function createDefaultRoutes(manifest) {
	const root = new URL(manifest.rootDir);
	return [
		{
			instance: default404Instance,
			matchesComponent: (filePath) => filePath.href === new URL(DEFAULT_404_COMPONENT, root).href,
			route: DEFAULT_404_ROUTE.route,
			component: DEFAULT_404_COMPONENT,
		},
		{
			instance: createServerIslandEndpoint(manifest),
			matchesComponent: (filePath) => filePath.href === new URL(SERVER_ISLAND_COMPONENT, root).href,
			route: SERVER_ISLAND_ROUTE,
			component: SERVER_ISLAND_COMPONENT,
		},
	];
}
export { DEFAULT_COMPONENTS, createDefaultRoutes };

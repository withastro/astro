import type { RoutesList } from '../../types/astro.js';
import { DEFAULT_404_ROUTE } from './internal/astro-designed-error-pages.js';

export function ensure404Route(manifest: RoutesList) {
	if (!manifest.routes.some((route) => route.route === '/404')) {
		manifest.routes.push(DEFAULT_404_ROUTE);
	}
	return manifest;
}

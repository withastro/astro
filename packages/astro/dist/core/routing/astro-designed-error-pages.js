import { DEFAULT_404_ROUTE } from './internal/astro-designed-error-pages.js';
function ensure404Route(manifest) {
	if (!manifest.routes.some((route) => route.route === '/404')) {
		manifest.routes.push(DEFAULT_404_ROUTE);
	}
	return manifest;
}
export { ensure404Route };

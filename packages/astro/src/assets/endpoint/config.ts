import type { InjectedRoute } from '@astrojs/vite-plugin-router';
import type { AstroSettings } from '../../types/astro.js';

/** The image endpoint, added to the route table as an internal route. */
export function getImageEndpointRoute(
	settings: AstroSettings,
	mode: 'dev' | 'build',
): InjectedRoute {
	const { endpoint } = settings.config.image;
	return {
		pattern: endpoint.route,
		entrypoint:
			endpoint.entrypoint ??
			(mode === 'dev' ? 'astro/assets/endpoint/dev' : 'astro/assets/endpoint/generic'),
	};
}

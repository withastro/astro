import { resolveInjectedRoute } from '../../core/routing/manifest/create.js';
import type { AstroSettings, ManifestData } from '../../types/astro.js';
import type { RouteData } from '../../types/public/internal.js';

export function injectImageEndpoint(
	settings: AstroSettings,
	manifest: ManifestData,
	mode: 'dev' | 'build',
	cwd?: string,
) {
	manifest.routes.push(getImageEndpointData(settings, mode, cwd));
}

export function ensureImageEndpointRoute(
	settings: AstroSettings,
	manifest: ManifestData,
	mode: 'dev' | 'build',
	cwd?: string,
) {
	if (!manifest.routes.some((route) => route.route === '/_image')) {
		manifest.routes.push(getImageEndpointData(settings, mode, cwd));
	}
}

function getImageEndpointData(
	settings: AstroSettings,
	mode: 'dev' | 'build',
	cwd?: string,
): RouteData {
	const endpointEntrypoint =
		settings.config.image.endpoint ??
		(mode === 'dev' ? 'astro/assets/endpoint/node' : 'astro/assets/endpoint/generic');

	return {
		type: 'endpoint',
		isIndex: false,
		route: '/_image',
		pattern: /^\/_image$/,
		segments: [[{ content: '_image', dynamic: false, spread: false }]],
		params: [],
		component: resolveInjectedRoute(endpointEntrypoint, settings.config.root, cwd).component,
		generate: () => '',
		pathname: '/_image',
		prerender: false,
		fallbackRoutes: [],
	};
}

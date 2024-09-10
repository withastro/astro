import { resolveInjectedRoute } from '../../core/routing/manifest/create.js';
import { getPattern } from '../../core/routing/manifest/pattern.js';
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

	const segments = [[{ content: '_image', dynamic: false, spread: false }]];
	const trailing = settings.config.trailingSlash === 'always' ? '/' : '';

	return {
		type: 'endpoint',
		isIndex: false,
		route: '/_image' + trailing,
		pattern: getPattern(segments, settings.config.base, settings.config.trailingSlash),
		segments,
		params: [],
		component: resolveInjectedRoute(endpointEntrypoint, settings.config.root, cwd).component,
		generate: () => '',
		pathname: '/_image' + trailing,
		prerender: false,
		fallbackRoutes: [],
	};
}

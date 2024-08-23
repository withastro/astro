import { resolveInjectedRoute } from '../../core/routing/manifest/create.js';
import type { AstroSettings, ManifestData } from '../../types/astro.js';

export function injectImageEndpoint(
	settings: AstroSettings,
	manifest: ManifestData,
	mode: 'dev' | 'build',
	cwd?: string,
) {
	const endpointEntrypoint =
		settings.config.image.endpoint ??
		(mode === 'dev' ? 'astro/assets/endpoint/node' : 'astro/assets/endpoint/generic');

	manifest.routes.push({
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
	});
}

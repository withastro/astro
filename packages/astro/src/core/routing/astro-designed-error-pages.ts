import type { ManifestData } from '../../@types/astro.js';
import { DEFAULT_404_COMPONENT } from '../constants.js';

export function ensure404Route(manifest: ManifestData) {
	if (!manifest.routes.some((route) => route.route === '/404')) {
		manifest.routes.push({
			component: DEFAULT_404_COMPONENT,
			generate: () => '',
			params: [],
			pattern: /\/404/,
			prerender: false,
			segments: [[{ content: '404', dynamic: false, spread: false }]],
			type: 'page',
			route: '/404',
			fallbackRoutes: [],
			isIndex: false,
		});
	}
	return manifest;
}

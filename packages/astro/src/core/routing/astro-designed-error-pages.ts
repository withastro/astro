import type { ManifestData } from "../../@types/astro.js";

export function ensure404Route(manifest: ManifestData) {
	if (!manifest.routes.some(route => route.route === '/404')) {
		manifest.routes.push({
			component: 'astro-default-404',
			generate: () => '',
			params: [],
			pattern: /\/404/,
			prerender: false,
			segments: [],
			type: 'endpoint',
			route: '/404',
			fallbackRoutes: [],
			isIndex: false,
		})
	}
	return manifest;
}

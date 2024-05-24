import type { ManifestData, RouteData } from '../../@types/astro.js';
import notFoundTemplate from '../../template/4xx.js';
import { DEFAULT_404_COMPONENT } from '../constants.js';

export const DEFAULT_404_ROUTE: RouteData = {
	component: DEFAULT_404_COMPONENT,
	generate: () => '',
	params: [],
	pattern: /\/404/,
	prerender: false,
	pathname: '/404',
	segments: [[{ content: '404', dynamic: false, spread: false }]],
	type: 'page',
	route: '/404',
	fallbackRoutes: [],
	isIndex: false,
};

export function ensure404Route(manifest: ManifestData) {
	if (!manifest.routes.some((route) => route.route === '/404')) {
		manifest.routes.push(DEFAULT_404_ROUTE);
	}
	return manifest;
}

export async function default404Page({ pathname }: { pathname: string }) {
	return new Response(
		notFoundTemplate({
			statusCode: 404,
			title: 'Not found',
			tabTitle: '404: Not Found',
			pathname,
		}),
		{ status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
	);
}
// mark the function as an AstroComponentFactory for the rendering internals
default404Page.isAstroComponentFactory = true;

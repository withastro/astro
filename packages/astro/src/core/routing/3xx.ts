import redirectTemplate, { type RedirectTemplateOptions } from '../../template/3xx.js';
import type { RoutesList, ComponentInstance } from '../../types/astro.js';
import type { RouteData } from '../../types/public/index.js';
import { DEFAULT_3XX_COMPONENT } from '../constants.js';

export const DEFAULT_3XX_ROUTE: RouteData = {
	component: DEFAULT_3XX_COMPONENT,
	generate: () => '',
	params: [],
	pattern: /\/3xx/,
	prerender: false,
	pathname: '/3xx',
	segments: [[{ content: '3xx', dynamic: false, spread: false }]],
	type: 'page',
	route: '/3xx',
	fallbackRoutes: [],
	isIndex: false,
	origin: 'internal',
};

export function ensure3xxRoute(manifest: RoutesList) {
	if (!manifest.routes.some((route) => route.route === '/3xx')) {
		manifest.routes.push(DEFAULT_3XX_ROUTE);
	}
	return manifest;
}

export async function default3xxPage({
	status,
	absoluteLocation,
	relativeLocation,
	from,
}: RedirectTemplateOptions) {
	return new Response(
		redirectTemplate({
			status,
			absoluteLocation,
			relativeLocation,
			from,
		}),
		{
			status,
			headers: { 'Content-Type': 'text/html' },
		},
	);
}

// mark the function as an AstroComponentFactory for the rendering internals
default3xxPage.isAstroComponentFactory = true;

export const default3xxInstance: ComponentInstance = {
	default: default3xxPage,
};

// A short delay causes Google to interpret the redirect as temporary.
// https://developers.google.com/search/docs/crawling-indexing/301-redirects#metarefresh

export async function injectRedirectMetaTags(html: string, location: string, status: number) {
	const delay = status === 302 ? 2 : 0;
	return html.replace(
		/<head[^>]*>/i,
		`$&
    <meta http-equiv="refresh" content="${delay};url=${location}">
    <meta name="robots" content="noindex">
    <link rel="canonical" href="${location}">`,
	);
}

// @ts-check
import { AstroCookies } from '../../../dist/core/cookies/index.js';
import { makeRoute, staticPart } from '../routing/test-helpers.js';

export { createManifest } from '../app/test-helpers.js';

/**
 * Creates a mock APIContext suitable for calling middleware directly via `callMiddleware()`.
 *
 * All fields can be overridden. The `cookies` field uses the real `AstroCookies` class
 * by default to avoid mock drift.
 *
 * @param {Partial<import('astro').APIContext> & { url?: string | URL }} overrides
 * @returns {import('astro').APIContext}
 */
export function createMockAPIContext(overrides = {}) {
	const url =
		overrides.url instanceof URL ? overrides.url : new URL(overrides.url ?? 'http://localhost/');
	const request = overrides.request ?? new Request(url);
	const cookies = overrides.cookies ?? new AstroCookies(request);

	return /** @type {import('astro').APIContext} */ ({
		url,
		request,
		locals: overrides.locals ?? {},
		params: overrides.params ?? {},
		cookies,
		redirect:
			overrides.redirect ??
			((path, status = 302) => new Response(null, { status, headers: { Location: String(path) } })),
		rewrite:
			overrides.rewrite ??
			(() => {
				throw new Error(
					'rewrite() is not mocked -- provide a mock if your middleware uses rewrite',
				);
			}),
		props: overrides.props ?? {},
		routePattern: overrides.routePattern ?? '',
		isPrerendered: overrides.isPrerendered ?? false,
		site: overrides.site,
		generator: overrides.generator ?? 'astro-test',
		clientAddress: overrides.clientAddress ?? '127.0.0.1',
		originPathname: overrides.originPathname ?? url.pathname,
	});
}

/**
 * Creates a response function compatible with callMiddleware's third argument.
 * This simulates what "rendering the page" would return.
 *
 * @param {string} body - The response body
 * @param {ResponseInit} [init] - Optional response init (status, headers, etc.)
 * @returns {(ctx: import('astro').APIContext, payload?: unknown) => Promise<Response>}
 */
export function createResponseFunction(body = '<html><body>OK</body></html>', init = {}) {
	return async (_ctx, _payload) => new Response(body, init);
}

/**
 * Convenience wrapper around `makeRoute` from routing test-helpers.
 * Auto-generates segments from the route string for simple static routes,
 * while using the real `getPattern()` for regex generation.
 *
 * @param {object} overrides
 * @param {string} overrides.route - The route pattern (e.g. '/foo', '/api/endpoint')
 * @param {'page' | 'endpoint' | 'redirect' | 'fallback'} [overrides.type]
 * @param {string} [overrides.component]
 * @param {boolean} [overrides.prerender]
 * @param {boolean} [overrides.isIndex]
 * @param {string} [overrides.pathname]
 * @param {import('../../../dist/types/public/internal.js').RoutePart[][]} [overrides.segments]
 * @param {'always' | 'never' | 'ignore'} [overrides.trailingSlash]
 */
export function createRouteData(overrides) {
	const route = overrides.route;
	const segments =
		overrides.segments ??
		(route === '/'
			? [[]]
			: route
					.split('/')
					.filter(Boolean)
					.map((s) => [staticPart(s)]));

	return makeRoute({
		route,
		segments,
		trailingSlash: overrides.trailingSlash ?? 'ignore',
		pathname: overrides.pathname ?? route,
		type: overrides.type ?? 'page',
		component: overrides.component ?? `src/pages${route === '/' ? '/index' : route}.astro`,
		isIndex: overrides.isIndex ?? route === '/',
		prerender: overrides.prerender ?? false,
	});
}

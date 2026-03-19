import { createBasicPipeline } from './test-utils.js';
import { makeRoute, staticPart } from './routing/test-helpers.js';
import { AstroCookies } from '../../dist/core/cookies/index.js';
import { App } from '../../dist/core/app/app.js';
import {
	createComponent,
	render,
	renderComponent,
	spreadAttributes,
} from '../../dist/runtime/server/index.js';
import { createManifest, createRouteInfo } from './app/test-helpers.js';

/**
 * Mock utilities for unit tests.
 *
 * This file contains lightweight mock functions for unit testing Astro internals.
 * For integration tests that need full structures, use the test-helpers.js files
 * in their respective directories.
 */

/**
 * Creates a minimal RenderContext mock for unit testing redirect functions.
 *
 * This is a lightweight mock that provides only what renderRedirect() needs,
 * without the overhead of creating a full RenderContext instance.
 *
 * @param {object} overrides - Properties to override
 * @param {Request} [overrides.request] - The request object
 * @param {object} [overrides.routeData] - Route data including redirect config
 * @param {Record<string, string>} [overrides.params] - Route parameters
 * @param {object} [overrides.pipeline] - Pipeline instance
 * @returns {object} A mock render context suitable for testing renderRedirect
 *
 * @example
 * const context = createMockRenderContext({
 *   request: new Request('http://localhost/source'),
 *   routeData: { type: 'redirect', redirect: '/target' },
 *   params: { slug: 'my-post' }
 * });
 */
export function createMockRenderContext(overrides = {}) {
	const pipeline =
		overrides.pipeline ||
		createBasicPipeline({
			manifest: {
				rootDir: import.meta.url,
				experimentalQueuedRendering: { enabled: true },
				trailingSlash: 'never',
			},
		});

	return {
		request: overrides.request || new Request('http://localhost/'),
		routeData: overrides.routeData || {},
		params: overrides.params || {},
		pipeline,
		...overrides,
	};
}

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
 * Creates an App instance with routes mapped to components or modules.
 * Useful for testing rendering behavior without fixtures.
 *
 * @param {Function} pageComponent - A component created via `createComponent()`
 * @param {object} [options]
 * @param {string} [options.route] - Route pattern (default: '/test')
 * @param {object} [options.routeOverrides] - Extra fields passed to createRouteData()
 * @param {object} [options.manifestOverrides] - Extra fields passed to createManifest()
 * @param {{ routeData: object, module: Function }[]} [options.extraRoutes] - Additional routes with their modules
 * @returns {import('../../dist/core/app/app.js').App}
 *
 * @example
 * const page = createComponent(() => render`<h1>Hello</h1>`);
 * const app = createTestApp(page);
 * const response = await app.render(new Request('http://example.com/test'));
 */
export function createTestApp(pageComponent, options = {}) {
	const routeData = createRouteData({
		route: options.route ?? '/test',
		...options.routeOverrides,
	});
	const routes = [createRouteInfo(routeData)];
	const pageMap = new Map([
		[routeData.component, async () => ({ page: async () => ({ default: pageComponent }) })],
	]);

	if (options.extraRoutes) {
		for (const { routeData: extra, module } of options.extraRoutes) {
			routes.push(createRouteInfo(extra));
			pageMap.set(extra.component, module);
		}
	}

	return new App(
		createManifest({
			routes,
			pageMap,
			...options.manifestOverrides,
		}),
	);
}

/**
 * Creates a component that spreads all props onto a `<span>` and renders
 * `Astro.props.class` as text content. Useful for testing prop forwarding.
 *
 * Equivalent to: `<span {...Astro.props}>{Astro.props.class}</span>`
 */
export const spreadPropsSpan = createComponent((result, props, slots) => {
	const Astro = result.createAstro(props, slots);
	return render`<span${spreadAttributes(Astro.props)}>${Astro.props.class ?? ''}</span>`;
});

/**
 * Creates a page component that renders the given child component once for each
 * props object in the array.
 *
 * @param {Function} childComponent - The component to render
 * @param {Record<string, any>[]} propsArray - Array of props objects
 * @returns {Function} A page component
 *
 * @example
 * const page = createMultiChildPage(spreadPropsSpan, [
 *   { 'class:list': ['foo', 'bar'] },
 *   { style: { color: 'red' } },
 * ]);
 * const app = createTestApp(page);
 */
export function createMultiChildPage(childComponent, propsArray) {
	return createComponent((result) => {
		const renders = propsArray.map(
			(props) => render`${renderComponent(result, 'Child', childComponent, props)}`,
		);
		return render`${renders}`;
	});
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
 * @param {import('../../dist/types/public/internal.js').RoutePart[][]} [overrides.segments]
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

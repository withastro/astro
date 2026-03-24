import { createBasicPipeline } from './test-utils.js';
import { makeRoute, staticPart } from './routing/test-helpers.js';
import { AstroCookies } from '../../dist/core/cookies/index.js';
import { App } from '../../dist/core/app/app.js';
import { baseService } from '../../dist/assets/services/service.js';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
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
 * Converts a component + route config into the shape expected by createTestApp.
 *
 * @param {Function} component - A component created via `createComponent()`
 * @param {object} routeConfig - Fields passed to createRouteData()
 * @param {string} routeConfig.route - The route pattern (e.g. '/about', '/[slug]')
 * @returns {{ routeData: object, module: Function }}
 */
export function createPage(component, routeConfig) {
	const routeData = createRouteData(routeConfig);
	return {
		routeData,
		module: async () => ({ page: async () => ({ default: component }) }),
	};
}

/**
 * Creates an App instance with one or more pages.
 *
 * @param {Array<{ routeData: object, module: Function }>} pages - Pages created via createPage()
 * @param {object} [manifestOverrides] - Extra fields passed to createManifest()
 * @returns {import('../../dist/core/app/app.js').App}
 *
 * @example
 * const app = createTestApp([
 *   createPage(myComponent, { route: '/about' }),
 *   createPage(indexComponent, { route: '/', isIndex: true }),
 * ]);
 * const response = await app.render(new Request('http://example.com/about'));
 */
export function createTestApp(pages, manifestOverrides = {}) {
	const routes = [];
	const pageMap = new Map();
	for (const { routeData, module } of pages) {
		routes.push(createRouteInfo(routeData));
		pageMap.set(routeData.component, module);
	}

	return new App(
		createManifest({
			routes,
			pageMap,
			...manifestOverrides,
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
 * const app = createTestApp([createPage(page, { route: '/test' })]);
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

/**
 * An image service for unit tests that extends baseService with a getURL
 * that doesn't depend on import.meta.env.BASE_URL.
 */
const unitTestImageService = {
	...baseService,
	getURL(options, imageConfig) {
		const src = typeof options.src === 'string' ? options.src : options.src.src;
		// Replicate baseService's allowlist check without import.meta.env.BASE_URL
		if (typeof options.src === 'string' && !isRemoteAllowed(options.src, imageConfig)) {
			return options.src;
		}
		const params = new URLSearchParams();
		params.set('href', src);
		if (options.width) params.set('w', String(options.width));
		if (options.height) params.set('h', String(options.height));
		if (options.format) params.set('f', options.format);
		if (options.fit) params.set('fit', options.fit);
		if (options.position) params.set('pos', options.position);
		return '/_image?' + params.toString();
	},
};

/**
 * Installs the unit test image service on globalThis so that getImage()
 * can resolve it without the virtual:image-service Vite module.
 * Returns the imageConfig object to pass to getImage(), and a cleanup function.
 *
 * Use the cleanup function inside the after testing hook.
 *
 * @param {object} [overrides]
 * @param {string[]} [overrides.domains]
 * @param {object[]} [overrides.remotePatterns]
 * @returns {{ imageConfig: object, cleanup: () => void }}
 */
export function installImageService(overrides = {}) {
	globalThis.astroAsset = { imageService: unitTestImageService };

	const imageConfig = {
		service: { entrypoint: 'test', config: {} },
		domains: overrides.domains ?? [],
		remotePatterns: overrides.remotePatterns ?? [],
		endpoint: { route: '/_image' },
	};

	return {
		imageConfig,
		cleanup() {
			globalThis.astroAsset = undefined;
		},
	};
}

/**
 * Creates a small Astro source component with an empty frontmatter
 * @param html
 * @returns {string}
 */
export function createMockAstroSource(html) {
	return `---\n---\n<html>${html}</html>`;
}

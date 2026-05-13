import { createBasicPipeline } from './test-utils.ts';
import { makeRoute, staticPart } from './routing/test-helpers.ts';
import { AstroCookies } from '../../dist/core/cookies/index.js';
import { App } from '../../dist/core/app/app.js';
import { FetchState } from '../../dist/core/fetch/fetch-state.js';
import { fetchStateSymbol } from '../../dist/core/constants.js';
import { baseService } from '../../dist/assets/services/service.js';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import {
	createComponent,
	render,
	renderComponent,
	spreadAttributes,
} from '../../dist/runtime/server/index.js';
import { createManifest, createRouteInfo } from './app/test-helpers.ts';
import type { Pipeline } from '../../dist/core/render/index.js';
import type { RedirectConfig } from '../../dist/types/public/config.js';
import type { RouteData, RoutePart, RouteType } from '../../dist/types/public/internal.js';
import type { APIContext } from '../../dist/types/public/context.js';
import type { SSRManifest, RouteInfo } from '../../dist/core/app/types.js';
import type { AstroComponentFactory } from '../../dist/runtime/server/render/index.js';
import type { ImageTransform } from '../../dist/assets/types.js';

/**
 * Mock utilities for unit tests.
 *
 * This file contains lightweight mock functions for unit testing Astro internals.
 * For integration tests that need full structures, use the test-helpers.js files
 * in their respective directories.
 */

interface LightMockRenderContextOverrides {
	request?: Request;
	routeData?: Partial<RouteData>;
	params?: Record<string, string>;
	pipeline?: Pipeline;
	[key: string]: unknown;
}

/**
 * Creates a minimal RenderContext mock for unit testing functions that
 * used to take a `RenderContext` directly. Internal helper used by
 * `createMockFetchState`.
 */
function createMockRenderContext(overrides: LightMockRenderContextOverrides = {}) {
	const pipeline =
		overrides.pipeline || createBasicPipeline({ manifest: { trailingSlash: 'never' } });

	return {
		request: overrides.request || new Request('http://localhost/'),
		routeData: overrides.routeData || {},
		params: overrides.params || {},
		pipeline,
		...overrides,
	};
}

/**
 * Wraps a `createMockRenderContext(...)` result in a minimal `FetchState`
 * so it can be passed to functions that now take state (e.g.
 * `renderRedirect(state)`). The `renderContext` field on the returned
 * state is the duck-typed mock from `createMockRenderContext`.
 */
export function createMockFetchState(overrides: LightMockRenderContextOverrides = {}) {
	const ctx = createMockRenderContext(overrides);
	const state = new FetchState(ctx.pipeline, ctx.request);
	state.routeData = ctx.routeData as any;
	state.params = ctx.params as any;
	return state;
}

interface MockAPIContextOverrides extends Partial<Omit<APIContext, 'url'>> {
	url?: string | URL;
}

/**
 * Creates a mock APIContext suitable for calling middleware directly via `callMiddleware()`.
 *
 * All fields can be overridden. The `cookies` field uses the real `AstroCookies` class
 * by default to avoid mock drift.
 *
 * Also stashes a minimal `FetchState` on the context via `fetchStateSymbol`
 * so internal shims that expect it (e.g. the manual-strategy i18n
 * wrapper in `src/i18n/middleware.ts`) can resolve per-request state.
 * The stashed `FetchState.renderContext` is a duck-typed stub with just
 * the fields those shims read (`computeCurrentLocale`,
 * `routeData.prerender`, `rewrite`). Tests that need different behavior
 * can override `rewrite` / `isPrerendered` here and the stub will use
 * those values.
 */
export function createMockAPIContext(overrides: MockAPIContextOverrides = {}): APIContext {
	const url =
		overrides.url instanceof URL ? overrides.url : new URL(overrides.url ?? 'http://localhost/');
	const request = overrides.request ?? new Request(url);
	const cookies = overrides.cookies ?? new AstroCookies(request);

	const rewrite =
		overrides.rewrite ??
		(() => {
			throw new Error('rewrite() is not mocked -- provide a mock if your middleware uses rewrite');
		});
	const isPrerendered = overrides.isPrerendered ?? false;

	const ctx = {
		url,
		request,
		locals: overrides.locals ?? {},
		params: overrides.params ?? {},
		cookies,
		redirect:
			overrides.redirect ??
			((path, status = 302) => new Response(null, { status, headers: { Location: String(path) } })),
		rewrite,
		props: overrides.props ?? {},
		routePattern: overrides.routePattern ?? '',
		isPrerendered,
		site: overrides.site,
		generator: overrides.generator ?? 'astro-test',
		clientAddress: overrides.clientAddress ?? '127.0.0.1',
		originPathname: overrides.originPathname ?? url.pathname,
	} as APIContext;

	// Build a minimal FetchState and stash it on the context so internal
	// shims (e.g. `createI18nMiddleware`) can find per-request state.
	const pipeline = createBasicPipeline();
	const state = new FetchState(pipeline, request);
	state.routeData = { prerender: isPrerendered } as any;
	// If the test provides a mock rewrite, override the FetchState's
	// rewrite method so it doesn't go through the real Rewrites handler.
	if (overrides.rewrite) {
		state.rewrite = overrides.rewrite;
	}
	Reflect.set(ctx, fetchStateSymbol, state);

	return ctx;
}

/**
 * Creates a response function compatible with callMiddleware's third argument.
 * This simulates what "rendering the page" would return.
 */
export function createResponseFunction(
	body = '<html><body>OK</body></html>',
	init: ResponseInit = {},
): (_ctx: APIContext, _payload?: unknown) => Promise<Response> {
	return async (_ctx, _payload) => new Response(body, init);
}

interface PageResult {
	routeData: RouteData;
	module: () => Promise<{ page: () => Promise<{ default: AstroComponentFactory }> }>;
}

/**
 * Converts a component + route config into the shape expected by createTestApp.
 */
export function createPage(
	component: AstroComponentFactory,
	routeConfig: CreateRouteDataOptions,
): PageResult {
	const routeData = createRouteData(routeConfig);
	return {
		routeData,
		module: async () => ({ page: async () => ({ default: component }) }),
	};
}

/**
 * Creates a redirect route entry for use with createTestApp.
 */
export function createRedirect(
	routeConfig: CreateRouteDataOptions & { redirect: RedirectConfig },
): PageResult {
	const routeData = createRouteData({ ...routeConfig, type: 'redirect' });
	return {
		routeData,
		// Redirect routes don't render a component, but the pageMap still
		// needs an entry keyed by component path.
		module: async () => ({ page: async () => ({ default: undefined as any }) }),
	};
}

/**
 * Creates an endpoint route entry for use with createTestApp.
 * The `handlers` object maps HTTP methods to handler functions,
 * e.g. `{ GET: (ctx) => new Response('ok') }`.
 */
export function createEndpoint(
	handlers: Record<string, (ctx: APIContext) => Response | Promise<Response>>,
	routeConfig: CreateRouteDataOptions,
): PageResult {
	const routeData = createRouteData({ ...routeConfig, type: 'endpoint' });
	return {
		routeData,
		module: async () => ({ page: async () => handlers as any }),
	};
}

/**
 * Creates an App instance with one or more pages.
 */
export function createTestApp(
	pages: PageResult[],
	manifestOverrides: Record<string, unknown> = {},
): App {
	const routes: RouteInfo[] = [];
	const pageMap = new Map<string, () => Promise<Record<string, unknown>>>();
	for (const { routeData, module } of pages) {
		routes.push(createRouteInfo(routeData) as RouteInfo);
		pageMap.set(routeData.component, module);
	}

	const manifest = createManifest({
		routes,
		pageMap: pageMap as unknown as ReturnType<typeof createManifest>['pageMap'],
		...manifestOverrides,
	});

	return new App(manifest as unknown as SSRManifest);
}

/**
 * Creates a component that spreads all props onto a `<span>` and renders
 * `Astro.props.class` as text content. Useful for testing prop forwarding.
 *
 * Equivalent to: `<span {...Astro.props}>{Astro.props.class}</span>`
 */
export const spreadPropsSpan: AstroComponentFactory = createComponent(
	(result: any, props: any, slots: any) => {
		const Astro = result.createAstro(props, slots);
		return render`<span${spreadAttributes(Astro.props)}>${Astro.props.class ?? ''}</span>`;
	},
);

/**
 * Creates a page component that renders the given child component once for each
 * props object in the array.
 */
export function createMultiChildPage(
	childComponent: AstroComponentFactory,
	propsArray: Record<string, unknown>[],
): AstroComponentFactory {
	return createComponent((result: any) => {
		const renders = propsArray.map(
			(props) => render`${renderComponent(result, 'Child', childComponent, props)}`,
		);
		return render`${renders}`;
	});
}

interface CreateRouteDataOptions {
	route: string;
	type?: RouteType;
	component?: string;
	prerender?: boolean;
	isIndex?: boolean;
	pathname?: string;
	segments?: RoutePart[][];
	trailingSlash?: 'always' | 'never' | 'ignore';
	redirect?: RedirectConfig;
	redirectRoute?: RouteData;
}

/**
 * Convenience wrapper around `makeRoute` from routing test-helpers.
 * Auto-generates segments from the route string for simple static routes,
 * while using the real `getPattern()` for regex generation.
 */
export function createRouteData(overrides: CreateRouteDataOptions): RouteData {
	const route = overrides.route;
	const segments: RoutePart[][] =
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
		redirect: overrides.redirect,
		redirectRoute: overrides.redirectRoute,
	});
}

/**
 * An image service for unit tests that extends baseService with a getURL
 * that doesn't depend on import.meta.env.BASE_URL.
 */
const unitTestImageService = {
	...baseService,
	getURL(
		options: ImageTransform,
		imageConfig: {
			domains: string[];
			remotePatterns: { hostname?: string; pathname?: string; protocol?: string; port?: string }[];
		},
	) {
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

interface ImageServiceOverrides {
	domains?: string[];
	remotePatterns?: { hostname?: string; pathname?: string; protocol?: string; port?: string }[];
}

/**
 * Installs the unit test image service on globalThis so that getImage()
 * can resolve it without the virtual:image-service Vite module.
 * Returns the imageConfig object to pass to getImage(), and a cleanup function.
 *
 * Use the cleanup function inside the after testing hook.
 */
export function installImageService(overrides: ImageServiceOverrides = {}): {
	imageConfig: {
		service: { entrypoint: string; config: Record<string, never> };
		domains: string[];
		remotePatterns: { hostname?: string; pathname?: string; protocol?: string; port?: string }[];
		endpoint: { route: string };
	};
	cleanup: () => void;
} {
	(globalThis as any).astroAsset = { imageService: unitTestImageService };

	const imageConfig = {
		service: { entrypoint: 'test', config: {} as Record<string, never> },
		domains: overrides.domains ?? [],
		remotePatterns: overrides.remotePatterns ?? [],
		endpoint: { route: '/_image' },
	};

	return {
		imageConfig,
		cleanup() {
			(globalThis as any).astroAsset = undefined;
		},
	};
}

/**
 * Creates a small Astro source component with an empty frontmatter
 */
export function createMockAstroSource(html: string): string {
	return `---\n---\n<html>${html}</html>`;
}

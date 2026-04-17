import { createBasicPipeline } from './test-utils.ts';
import { makeRoute, staticPart } from './routing/test-helpers.ts';
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
import { createManifest, createRouteInfo } from './app/test-helpers.ts';

import type { Pipeline } from '../../dist/core/render/index.js';
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

interface MockRenderContextOverrides {
	request?: Request;
	routeData?: Partial<RouteData>;
	params?: Record<string, string>;
	pipeline?: Pipeline;
	[key: string]: unknown;
}

/**
 * Creates a minimal RenderContext mock for unit testing redirect functions.
 *
 * This is a lightweight mock that provides only what renderRedirect() needs,
 * without the overhead of creating a full RenderContext instance.
 */
export function createMockRenderContext(overrides: MockRenderContextOverrides = {}) {
	const pipeline =
		overrides.pipeline ||
		createBasicPipeline({
			manifest: {
				rootDir: new URL(import.meta.url),
				experimentalQueuedRendering: { enabled: true },
				trailingSlash: 'never',
			} as unknown as SSRManifest,
		});

	return {
		request: overrides.request || new Request('http://localhost/'),
		routeData: overrides.routeData || {},
		params: overrides.params || {},
		pipeline,
		...overrides,
	};
}

interface MockAPIContextOverrides extends Partial<Omit<APIContext, 'url'>> {
	url?: string | URL;
}

/**
 * Creates a mock APIContext suitable for calling middleware directly via `callMiddleware()`.
 *
 * All fields can be overridden. The `cookies` field uses the real `AstroCookies` class
 * by default to avoid mock drift.
 */
export function createMockAPIContext(overrides: MockAPIContextOverrides = {}): APIContext {
	const url =
		overrides.url instanceof URL ? overrides.url : new URL(overrides.url ?? 'http://localhost/');
	const request = overrides.request ?? new Request(url);
	const cookies = overrides.cookies ?? new AstroCookies(request);

	return {
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
	} as APIContext;
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

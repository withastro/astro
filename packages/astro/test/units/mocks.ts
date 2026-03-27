import { createBasicPipeline } from './test-utils.js';
import { makeRoute, staticPart } from './routing/test-helpers.js';
import type { MakeRouteOptions } from './routing/test-helpers.js';
import { AstroCookies } from '../../dist/core/cookies/index.js';
import { App } from '../../dist/core/app/app.js';
import { RenderContext } from '../../dist/core/render-context.js';
import { baseService } from '../../dist/assets/services/service.js';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import {
	createComponent,
	render,
	renderComponent,
	spreadAttributes,
} from '../../dist/runtime/server/index.js';
import type { AstroComponentFactory } from '../../dist/runtime/server/index.js';
import { createManifest, createRouteInfo } from './app/test-helpers.js';
import type { SSRManifest } from '../../dist/core/app/types.js';
import type { SinglePageBuiltModule } from '../../dist/core/build/types.js';
import type { RouteData, RoutePart } from '../../dist/types/public/internal.js';
import type { APIContext } from '../../dist/types/public/context.js';
import type { Pipeline } from '../../dist/core/render/index.js';

export async function createMockRenderContext(
	overrides: {
		pipeline?: Pipeline;
		request?: Request;
		routeData?: Partial<RouteData>;
		params?: Record<string, string>;
	} = {},
): Promise<RenderContext> {
	const pipeline =
		overrides.pipeline ||
		createBasicPipeline({
			manifest: {
				rootDir: new URL(import.meta.url),
				experimentalQueuedRendering: { enabled: true },
				trailingSlash: 'never',
			} as any,
		});

	const routeData = createRouteData({
		route: '/',
		type: 'redirect',
		...overrides.routeData,
	});

	const request = overrides.request ?? new Request('http://localhost/');

	const ctx = await RenderContext.create({
		pipeline,
		request,
		routeData,
		pathname: new URL(request.url).pathname,
		clientAddress: '127.0.0.1',
	});

	if (overrides.params) {
		ctx.params = overrides.params;
	}

	return ctx;
}

export function createMockAPIContext(
	overrides: Partial<APIContext> & { url?: string | URL } = {},
): APIContext {
	const url =
		overrides.url instanceof URL
			? overrides.url
			: new URL((overrides.url as string | undefined) ?? 'http://localhost/');
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
			((path: string, status = 302) =>
				new Response(null, { status, headers: { Location: String(path) } })),
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

export function createResponseFunction(
	body = '<html><body>OK</body></html>',
	init: ResponseInit = {},
) {
	return async (_ctx: APIContext, _payload?: unknown) => new Response(body, init);
}

export function createPage(
	component: AstroComponentFactory,
	routeConfig: Parameters<typeof createRouteData>[0],
) {
	const routeData = createRouteData(routeConfig);
	const module: () => Promise<SinglePageBuiltModule> = async () => ({
		page: async () => ({ default: component }),
	});
	return { routeData, module };
}

export function createTestApp(
	pages: Array<ReturnType<typeof createPage>>,
	manifestOverrides: Parameters<typeof createManifest>[0] = {},
) {
	const routes: ReturnType<typeof createRouteInfo>[] = [];
	const pageMap: NonNullable<SSRManifest['pageMap']> = new Map();
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

export const spreadPropsSpan = createComponent((result, props, slots) => {
	const Astro = result.createAstro(props, slots);
	return render`<span${spreadAttributes(Astro.props)}>${Astro.props.class ?? ''}</span>`;
});

export function createMultiChildPage(
	childComponent: AstroComponentFactory,
	propsArray: Record<string, unknown>[],
) {
	return createComponent((result) => {
		const renders = propsArray.map(
			(props) => render`${renderComponent(result, 'Child', childComponent, props)}`,
		);
		return render`${renders}`;
	});
}

/**
 * Builds a RouteData for use in unit tests.
 *
 * Accepts any subset of RouteData fields. `route` is the only required field —
 * all others have sensible defaults. `segments` and `pattern` are derived from
 * `route` when not supplied. Pass `trailingSlash` to control pattern generation.
 */
export function createRouteData(
	overrides: Partial<MakeRouteOptions> & { route: string },
): RouteData {
	const { route, segments: segmentsOverride, trailingSlash = 'ignore', ...rest } = overrides;

	const segments: RoutePart[][] =
		segmentsOverride ??
		(route === '/'
			? [[]]
			: route
					.split('/')
					.filter(Boolean)
					.map((s) => [staticPart(s)]));

	return makeRoute({
		route,
		segments,
		trailingSlash,
		pathname: route,
		type: 'page',
		component: `src/pages${route === '/' ? '/index' : route}.astro`,
		isIndex: route === '/',
		prerender: false,
		origin: 'project',
		...rest,
	});
}

const unitTestImageService = {
	...baseService,
	getURL(options: any, imageConfig: any) {
		const src = typeof options.src === 'string' ? options.src : options.src.src;
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

export function installImageService(
	overrides: { domains?: string[]; remotePatterns?: object[] } = {},
) {
	(globalThis as any).astroAsset = { imageService: unitTestImageService };

	const imageConfig = {
		service: { entrypoint: 'test', config: {} },
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

export function createMockAstroSource(html: string): string {
	return `---\n---\n<html>${html}</html>`;
}

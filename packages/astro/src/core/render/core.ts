import type { ComponentInstance, MarkdownRenderOptions, Params, Props, Renderer, RouteData, SSRElement } from '../../@types/astro';
import { LogOptions } from '../logger.js';

import { renderPage } from '../../runtime/server/index.js';
import { getParams } from '../routing/index.js';
import { createResult } from './result.js';
import { findPathItemByKey, RouteCache } from './route-cache.js';

export async function getParamsAndProps({ route, routeCache, pathname }: { route: RouteData | undefined; routeCache: RouteCache; pathname: string }): Promise<[Params, Props]> {
	// Handle dynamic routes
	let params: Params = {};
	let pageProps: Props;
	if (route && !route.pathname) {
		if (route.params.length) {
			const paramsMatch = route.pattern.exec(pathname);
			if (paramsMatch) {
				params = getParams(route.params)(paramsMatch);
			}
		}
		const routeCacheEntry = routeCache.get(route);
		if (!routeCacheEntry) {
			throw new Error(`[${route.component}] Internal error: route cache was empty, but expected to be full.`);
		}
		const paramsKey = JSON.stringify(params);
		const matchedStaticPath = findPathItemByKey(routeCacheEntry.staticPaths, paramsKey);
		if (!matchedStaticPath) {
			throw new Error(`[getStaticPaths] route pattern matched, but no matching static path found. (${pathname})`);
		}
		// This is written this way for performance; instead of spreading the props
		// which is O(n), create a new object that extends props.
		pageProps = Object.create(matchedStaticPath.props || Object.prototype);
	} else {
		pageProps = {};
	}
	return [params, pageProps];
}

interface RenderOptions {
	experimentalStaticBuild: boolean;
	logging: LogOptions,
	links: Set<SSRElement>;
	markdownRender: MarkdownRenderOptions,
	mod: ComponentInstance;
	origin: string;
	pathname: string;
	scripts: Set<SSRElement>;
	resolve: (s: string) => Promise<string>;
	renderers: Renderer[];
	route?: RouteData;
	routeCache: RouteCache;
	site?: string;
}

export async function render(opts: RenderOptions): Promise<string> {
	const {
		experimentalStaticBuild,
		links,
		logging,
		origin,
		markdownRender,
		mod,
		pathname,
		scripts,
		renderers,
		resolve,
		route,
		routeCache,
		site
	} = opts;

	const [params, pageProps] = await getParamsAndProps({
		route,
		routeCache,
		pathname,
	});

	// Validate the page component before rendering the page
	const Component = await mod.default;
	if (!Component) throw new Error(`Expected an exported Astro component but received typeof ${typeof Component}`);
	if (!Component.isAstroComponentFactory) throw new Error(`Unable to SSR non-Astro component (${route?.component})`);


	const result = createResult({
		experimentalStaticBuild,
		links,
		logging,
		markdownRender,
		origin,
		params,
		pathname,
		resolve,
		renderers,
		site,
		scripts
	});

	let html = await renderPage(result, Component, pageProps, null);

	// inject <!doctype html> if missing (TODO: is a more robust check needed for comments, etc.?)
	if (!/<!doctype html/i.test(html)) {
		html = '<!DOCTYPE html>\n' + html;
	}

	return html;
}

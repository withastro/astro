import type { ComponentInstance, MarkdownRenderOptions, Params, Props, Renderer, RouteData, SSRElement } from '../../@types/astro';
import type { LogOptions } from '../logger.js';

import { renderPage } from '../../runtime/server/index.js';
import { getParams } from '../routing/index.js';
import { createResult } from './result.js';
import { findPathItemByKey, RouteCache, callGetStaticPaths } from './route-cache.js';
import { warn } from '../logger.js';

interface GetParamsAndPropsOptions {
	mod: ComponentInstance;
	route: RouteData | undefined;
	routeCache: RouteCache;
	pathname: string;
	logging: LogOptions;
}

async function getParamsAndProps(opts: GetParamsAndPropsOptions): Promise<[Params, Props]> {
	const { logging, mod, route, routeCache, pathname } = opts;
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
		let routeCacheEntry = routeCache.get(route);
		if (!routeCacheEntry) {
			warn(logging, 'routeCache', `Internal Warning: getStaticPaths() called twice during the build. (${route.component})`);
			routeCacheEntry = await callGetStaticPaths(mod, route, true, logging);
			routeCache.set(route, routeCacheEntry);
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
		logging,
		mod,
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
	if (experimentalStaticBuild && !/<!doctype html/i.test(html)) {
		html = '<!DOCTYPE html>\n' + html;
	}

	return html;
}

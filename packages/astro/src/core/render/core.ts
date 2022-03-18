import type { ComponentInstance, EndpointHandler, MarkdownRenderOptions, Params, Props, SSRLoadedRenderer, RouteData, SSRElement } from '../../@types/astro';
import type { LogOptions } from '../logger.js';
import type { AstroRequest } from './request';

import { renderHead, renderPage } from '../../runtime/server/index.js';
import { getParams } from '../routing/index.js';
import { createResult } from './result.js';
import { findPathItemByKey, RouteCache, callGetStaticPaths } from './route-cache.js';

interface GetParamsAndPropsOptions {
	mod: ComponentInstance;
	route?: RouteData | undefined;
	routeCache: RouteCache;
	pathname: string;
	logging: LogOptions;
	ssr: boolean;
}

export const enum GetParamsAndPropsError {
	NoMatchingStaticPath,
}

export async function getParamsAndProps(opts: GetParamsAndPropsOptions): Promise<[Params, Props] | GetParamsAndPropsError> {
	const { logging, mod, route, routeCache, pathname, ssr } = opts;
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
		// During build, the route cache should already be populated.
		// During development, the route cache is filled on-demand and may be empty.
		// TODO(fks): Can we refactor getParamsAndProps() to receive routeCacheEntry
		// as a prop, and not do a live lookup/populate inside this lower function call.
		if (!routeCacheEntry) {
			routeCacheEntry = await callGetStaticPaths({ mod, route, isValidate: true, logging, ssr });
			routeCache.set(route, routeCacheEntry);
		}
		const matchedStaticPath = findPathItemByKey(routeCacheEntry.staticPaths, params);
		if (!matchedStaticPath && !ssr) {
			return GetParamsAndPropsError.NoMatchingStaticPath;
		}
		// Note: considered using Object.create(...) for performance
		// Since this doesn't inherit an object's properties, this caused some odd user-facing behavior.
		// Ex. console.log(Astro.props) -> {}, but console.log(Astro.props.property) -> 'expected value'
		// Replaced with a simple spread as a compromise
		pageProps = matchedStaticPath?.props ? { ...matchedStaticPath.props } : {};
	} else {
		pageProps = {};
	}
	return [params, pageProps];
}

export interface RenderOptions {
	legacyBuild: boolean;
	logging: LogOptions;
	links: Set<SSRElement>;
	markdownRender: MarkdownRenderOptions;
	mod: ComponentInstance;
	origin: string;
	pathname: string;
	scripts: Set<SSRElement>;
	resolve: (s: string) => Promise<string>;
	renderers: SSRLoadedRenderer[];
	route?: RouteData;
	routeCache: RouteCache;
	site?: string;
	ssr: boolean;
	method: string;
	headers: Headers;
}

export async function render(opts: RenderOptions): Promise<{ type: 'html'; html: string } | { type: 'response'; response: Response }> {
	const { headers, legacyBuild, links, logging, origin, markdownRender, method, mod, pathname, scripts, renderers, resolve, route, routeCache, site, ssr } = opts;

	const paramsAndPropsRes = await getParamsAndProps({
		logging,
		mod,
		route,
		routeCache,
		pathname,
		ssr,
	});

	if (paramsAndPropsRes === GetParamsAndPropsError.NoMatchingStaticPath) {
		throw new Error(`[getStaticPath] route pattern matched, but no matching static path found. (${pathname})`);
	}
	const [params, pageProps] = paramsAndPropsRes;

	// Validate the page component before rendering the page
	const Component = await mod.default;
	if (!Component) throw new Error(`Expected an exported Astro component but received typeof ${typeof Component}`);
	if (!Component.isAstroComponentFactory) throw new Error(`Unable to SSR non-Astro component (${route?.component})`);

	const result = createResult({
		legacyBuild,
		links,
		logging,
		markdownRender,
		origin,
		params,
		pathname,
		resolve,
		renderers,
		site,
		scripts,
		ssr,
		method,
		headers,
	});

	let page = await renderPage(result, Component, pageProps, null);

	if (page.type === 'response') {
		return page;
	}

	let html = page.html;
	// handle final head injection if it hasn't happened already
	if (html.indexOf('<!--astro:head:injected-->') == -1) {
		html = (await renderHead(result)) + html;
	}
	// cleanup internal state flags
	html = html.replace('<!--astro:head:injected-->', '');

	// inject <!doctype html> if missing (TODO: is a more robust check needed for comments, etc.?)
	if (!legacyBuild && !/<!doctype html/i.test(html)) {
		html = '<!DOCTYPE html>\n' + html;
	}

	return {
		type: 'html',
		html,
	};
}

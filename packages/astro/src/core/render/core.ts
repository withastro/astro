import type { MarkdownRenderingOptions } from '@astrojs/markdown-remark';
import type {
	ComponentInstance,
	Params,
	Props,
	RouteData,
	SSRElement,
	SSRLoadedRenderer,
} from '../../@types/astro';
import type { LogOptions } from '../logger/core.js';

import { renderComponent, renderHead, renderPage } from '../../runtime/server/index.js';
import { getParams } from '../routing/params.js';
import { createResult } from './result.js';
import { callGetStaticPaths, findPathItemByKey, RouteCache } from './route-cache.js';

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

export async function getParamsAndProps(
	opts: GetParamsAndPropsOptions
): Promise<[Params, Props] | GetParamsAndPropsError> {
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
	logging: LogOptions;
	links: Set<SSRElement>;
	styles?: Set<SSRElement>;
	markdown: MarkdownRenderingOptions;
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
	request: Request;
}

export async function render(
	opts: RenderOptions
): Promise<
	{ type: 'html'; html: string; response: ResponseInit } | { type: 'response'; response: Response }
> {
	const {
		links,
		styles,
		logging,
		origin,
		markdown,
		mod,
		pathname,
		scripts,
		renderers,
		request,
		resolve,
		route,
		routeCache,
		site,
		ssr,
	} = opts;

	const paramsAndPropsRes = await getParamsAndProps({
		logging,
		mod,
		route,
		routeCache,
		pathname,
		ssr,
	});

	if (paramsAndPropsRes === GetParamsAndPropsError.NoMatchingStaticPath) {
		throw new Error(
			`[getStaticPath] route pattern matched, but no matching static path found. (${pathname})`
		);
	}
	const [params, pageProps] = paramsAndPropsRes;

	// Validate the page component before rendering the page
	const Component = await mod.default;
	if (!Component)
		throw new Error(`Expected an exported Astro component but received typeof ${typeof Component}`);

	const result = createResult({
		links,
		styles,
		logging,
		markdown,
		origin,
		params,
		props: pageProps,
		pathname,
		resolve,
		renderers,
		request,
		site,
		scripts,
		ssr,
	});

	let page: Awaited<ReturnType<typeof renderPage>>;
	if (!Component.isAstroComponentFactory) {
		const props: Record<string, any> = { ...(pageProps ?? {}), 'server:root': true };
		const html = await renderComponent(result, Component.name, Component, props, null);
		page = {
			type: 'html',
			html: html.toString(),
		};
	} else {
		page = await renderPage(result, Component, pageProps, null);
	}

	if (page.type === 'response') {
		return page;
	}

	let html = page.html;

	// inject <!doctype html> if missing (TODO: is a more robust check needed for comments, etc.?)
	if (!/<!doctype html/i.test(html)) {
		html = '<!DOCTYPE html>\n' + html;
	}

	return {
		type: 'html',
		html,
		response: result.response,
	};
}

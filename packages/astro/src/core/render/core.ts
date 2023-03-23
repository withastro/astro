import type { ComponentInstance, Params, Props, RouteData } from '../../@types/astro';
import type { LogOptions } from '../logger/core.js';
import type { RenderContext } from './context.js';
import type { Environment } from './environment.js';

import { renderPage as runtimeRenderPage } from '../../runtime/server/index.js';
import { attachToResponse } from '../cookies/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
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
		const matchedStaticPath = findPathItemByKey(routeCacheEntry.staticPaths, params, route);
		if (!matchedStaticPath && (ssr ? mod.prerender : true)) {
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

export async function renderPage(mod: ComponentInstance, ctx: RenderContext, env: Environment) {
	const paramsAndPropsRes = await getParamsAndProps({
		logging: env.logging,
		mod,
		route: ctx.route,
		routeCache: env.routeCache,
		pathname: ctx.pathname,
		ssr: env.ssr,
	});

	if (paramsAndPropsRes === GetParamsAndPropsError.NoMatchingStaticPath) {
		throw new AstroError({
			...AstroErrorData.NoMatchingStaticPathFound,
			message: AstroErrorData.NoMatchingStaticPathFound.message(ctx.pathname),
			hint: ctx.route?.component
				? AstroErrorData.NoMatchingStaticPathFound.hint([ctx.route?.component])
				: '',
		});
	}
	const [params, pageProps] = paramsAndPropsRes;

	// Validate the page component before rendering the page
	const Component = mod.default;
	if (!Component)
		throw new Error(`Expected an exported Astro component but received typeof ${typeof Component}`);

	const result = createResult({
		adapterName: env.adapterName,
		links: ctx.links,
		styles: ctx.styles,
		logging: env.logging,
		markdown: env.markdown,
		mode: env.mode,
		origin: ctx.origin,
		params,
		props: pageProps,
		pathname: ctx.pathname,
		componentMetadata: ctx.componentMetadata,
		resolve: env.resolve,
		renderers: env.renderers,
		request: ctx.request,
		site: env.site,
		scripts: ctx.scripts,
		ssr: env.ssr,
		status: ctx.status ?? 200,
	});

	// Support `export const components` for `MDX` pages
	if (typeof (mod as any).components === 'object') {
		Object.assign(pageProps, { components: (mod as any).components });
	}

	const response = await runtimeRenderPage(
		result,
		Component,
		pageProps,
		null,
		env.streaming,
		ctx.route
	);

	// If there is an Astro.cookies instance, attach it to the response so that
	// adapters can grab the Set-Cookie headers.
	if (result.cookies) {
		attachToResponse(response, result.cookies);
	}

	return response;
}

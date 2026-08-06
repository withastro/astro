import type { Params } from '../../types/public/common.js';
import type { RedirectConfig } from '../../types/public/index.js';
import type { RouteData } from '../../types/public/internal.js';
import { PipelineFeatures } from '../base-pipeline.js';
import type { FetchState } from '../fetch/fetch-state.js';
import { getRouteGenerator } from '../routing/generator.js';

function isExternalURL(url: string): boolean {
	return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
}

export function redirectIsExternal(redirect: RedirectConfig): boolean {
	if (typeof redirect === 'string') {
		return isExternalURL(redirect);
	} else {
		return isExternalURL(redirect.destination);
	}
}

/**
 * Computes the HTTP status code for a redirect response.
 *
 * - If the route has a `redirectRoute` and an explicit numeric status, that status is used.
 * - Otherwise: GET → 301, non-GET (e.g. POST) → 308.
 */
export function computeRedirectStatus(
	method: string,
	redirect: RedirectConfig | undefined,
	redirectRoute: RouteData | undefined,
): number {
	return redirectRoute && typeof redirect === 'object'
		? redirect.status
		: method === 'GET'
			? 301
			: 308;
}

/**
 * Resolves the final redirect target URL by substituting dynamic params into
 * the redirect string (e.g. `/[slug]/page` → `/hello/page`).
 *
 * When `redirectRoute` is provided its route generator is used; otherwise params
 * are substituted manually into the string redirect target.
 */
export function resolveRedirectTarget(
	params: Params,
	redirect: RedirectConfig | undefined,
	redirectRoute: RouteData | undefined,
	trailingSlash: 'always' | 'never' | 'ignore',
): string {
	if (typeof redirectRoute !== 'undefined') {
		const generate = getRouteGenerator(redirectRoute.segments, trailingSlash);
		return generate(params) || redirectRoute?.pathname || '/';
	} else if (typeof redirect === 'string') {
		if (redirectIsExternal(redirect)) {
			return redirect;
		} else {
			let target = redirect;
			for (const param of Object.keys(params)) {
				const paramValue = params[param]!;
				target = target.replace(`[${param}]`, paramValue).replace(`[...${param}]`, paramValue);
			}
			return target;
		}
	} else if (typeof redirect === 'undefined') {
		return '/';
	}
	return redirect.destination;
}

export async function renderRedirect(state: FetchState) {
	state.pipeline.usedFeatures |= PipelineFeatures.redirects;
	const routeData = state.routeData!;
	const { redirect, redirectRoute } = routeData;
	const status = computeRedirectStatus(state.request.method, redirect, redirectRoute);
	const headers = {
		location: encodeURI(
			resolveRedirectTarget(
				state.params!,
				redirect,
				redirectRoute,
				state.pipeline.manifest.trailingSlash,
			),
		),
	};
	if (redirect && redirectIsExternal(redirect)) {
		if (typeof redirect === 'string') {
			return Response.redirect(redirect, status);
		} else {
			return Response.redirect(redirect.destination, status);
		}
	}
	return new Response(null, { status, headers });
}

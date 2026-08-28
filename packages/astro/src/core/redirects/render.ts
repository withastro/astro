import type { Params } from '../../types/public/common.js';
import type { RedirectConfig } from '../../types/public/index.js';
import type { RouteData } from '../../types/public/internal.js';
import {
	createCrossOriginForbiddenResponse,
	isForbiddenCrossOriginRequest,
} from '../app/origin-check.js';
import { attachCookiesToResponse } from '../cookies/index.js';
import { getCookiesFromResponse } from '../cookies/response.js';
import { getEnvironment } from '../environment/index.js';
import { markFeatureUsed, FetchFeatures } from '../fetch/features.js';
import { FetchState } from '../fetch/fetch-state.js';
import { handlePages } from '../pages/handler.js';
import { getRouteGenerator } from '../routing/generator.js';
import { getRouteTable } from '../routing/route-table.js';

const renderedRedirectPageSymbol = Symbol.for('astro.renderedRedirectPage');
const renderedRedirectPageHeader = 'x-astro-redirect-page';

function isRenderedRedirectPage(response: Response): boolean {
	return (
		Reflect.get(response, renderedRedirectPageSymbol) === true ||
		response.headers.has(renderedRedirectPageHeader)
	);
}

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
	markFeatureUsed(state.manifest, FetchFeatures.redirects);
	const routeData = state.routeData!;
	const { redirect, redirectRoute } = routeData;
	const status = computeRedirectStatus(state.request.method, redirect, redirectRoute);
	const headers = {
		location: encodeURI(
			resolveRedirectTarget(state.params!, redirect, redirectRoute, state.manifest.trailingSlash),
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

export function consumeRenderedRedirectPage(response: Response): {
	rendered: boolean;
	headers: Headers;
} {
	const rendered = isRenderedRedirectPage(response);
	const headers = new Headers(response.headers);
	headers.delete(renderedRedirectPageHeader);
	return { rendered, headers };
}

export async function renderRedirectPage(state: FetchState, response: Response): Promise<Response> {
	const redirectPage = getRouteTable(state.manifest).redirectPage;
	const redirectTo = response.headers.get('location');
	if (
		isRenderedRedirectPage(response) ||
		!redirectPage ||
		!redirectTo ||
		response.status < 300 ||
		response.status >= 400 ||
		response.status === 304 ||
		state.request.method === 'HEAD'
	) {
		return response;
	}

	const routeData = {
		...redirectPage,
		prerender: state.routeData?.prerender ?? redirectPage.prerender,
	};
	if (
		state.manifest.checkOrigin &&
		isForbiddenCrossOriginRequest(state.request, state.url, routeData.prerender)
	) {
		return createCrossOriginForbiddenResponse(state.request);
	}
	const redirectState = new FetchState(state.manifest, state.request, {
		...state.renderOptions,
		locals: state.locals,
		routeData,
	});
	redirectState.routeData = routeData;
	redirectState.pathname = state.pathname;
	redirectState.status = response.status;
	redirectState.locals = state.locals;
	redirectState.cookies = state.cookies;
	redirectState.inheritContextFrom(state);
	redirectState.initialProps = {
		status: response.status,
		redirectFrom: `${state.originalUrl.pathname}${state.originalUrl.search}`,
		redirectTo,
	};
	redirectState.componentInstance = await getEnvironment(state.manifest).getComponentByRoute(
		state.manifest,
		routeData,
	);

	const rendered = await handlePages(redirectState, redirectState.getAPIContext());
	if (!rendered.body) return response;
	attachCookiesToResponse(rendered, redirectState.cookies);

	const headers = new Headers(rendered.headers);
	for (const [name, value] of response.headers) {
		const lowerName = name.toLowerCase();
		if (
			lowerName === 'content-type' ||
			lowerName === 'content-length' ||
			lowerName === 'content-encoding' ||
			lowerName === 'transfer-encoding'
		) {
			continue;
		}
		if (lowerName === 'set-cookie') {
			headers.append(name, value);
		} else {
			headers.set(name, value);
		}
	}
	if (routeData.prerender) headers.set(renderedRedirectPageHeader, 'true');

	const result = new Response(rendered.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
	const originalCookies = getCookiesFromResponse(response);
	const renderedCookies = getCookiesFromResponse(rendered);
	if (originalCookies) {
		if (renderedCookies) originalCookies.merge(renderedCookies);
		attachCookiesToResponse(result, originalCookies);
	} else if (renderedCookies) {
		attachCookiesToResponse(result, renderedCookies);
	}
	Reflect.set(result, renderedRedirectPageSymbol, true);
	return result;
}

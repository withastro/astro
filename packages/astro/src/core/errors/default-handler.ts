import { removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';
import type { RenderErrorOptions } from '../app/base.js';
import type { SSRManifest } from '../app/types.js';
import { getEnvironment } from '../environment/index.js';
import { FetchState } from '../fetch/fetch-state.js';
import { prepareResponse } from '../app/prepare-response.js';
import { attachCookiesToResponse } from '../cookies/index.js';
import { getCookiesFromResponse } from '../cookies/response.js';
import { handleMiddleware } from '../middleware/astro-middleware.js';
import { handlePages } from '../pages/handler.js';
import { matchRoute } from '../routing/match.js';
import { getRouteTable } from '../routing/route-table.js';
import { provideSession } from '../session/provider.js';
import { validateHost } from '../app/validate-headers.js';
import { getErrorRoutePath } from '../../i18n/error-routes.js';
import { getOutputFilename } from '../output-filename.js';
import { rewroteToEmptyErrorResponse } from './handler.js';

type ErrorPagePath =
	| `${string}/404`
	| `${string}/500`
	| `${string}/404/`
	| `${string}/500/`
	| `${string}/404/index.html`
	| `${string}/500/index.html`
	| `${string}404.html`
	| `${string}500.html`;

/**
 * The default error strategy used in production SSR. Attempts to render the
 * matching error route (404.astro / 500.astro), falling back to a plain
 * response with the given status. Handles prerendered error pages via
 * `prerenderedErrorPageFetch`.
 */
export async function renderDefaultError(
	manifest: SSRManifest,
	request: Request,
	{
		status,
		response: originalResponse,
		skipMiddleware = false,
		error,
		pathname,
		...resolvedRenderOptions
	}: RenderErrorOptions,
): Promise<Response> {
	const resolvedPathname = pathname ?? new FetchState(manifest, request).pathname;
	const routeTable = getRouteTable(manifest);
	const errorRoutePath = getErrorRoutePath(
		resolvedPathname,
		status,
		routeTable.routes,
		manifest.i18n?.locales,
		manifest.trailingSlash === 'always',
	);
	const errorRouteData = matchRoute(errorRoutePath, routeTable);
	const url = new URL(request.url);
	if (errorRouteData) {
		if (errorRouteData.prerender) {
			// Validate the request URL origin before using it for the error page fetch.
			// Without this, an attacker-controlled Host header flows into statusURL,
			// causing the server to fetch from an arbitrary origin (SSRF).
			const allowedDomains = manifest.allowedDomains;
			const validatedHost = validateHost(url.host, url.protocol.replace(':', ''), allowedDomains);
			const safeOrigin = validatedHost ? url.origin : `${url.protocol}//localhost`;
			const statusURL = new URL(
				`${removeTrailingForwardSlash(manifest.base)}${getOutputFilename(
					manifest.buildFormat,
					errorRouteData.route,
					errorRouteData,
				)}`,
				safeOrigin,
			);
			if (statusURL.toString() !== request.url && resolvedRenderOptions.prerenderedErrorPageFetch) {
				try {
					const response = await resolvedRenderOptions.prerenderedErrorPageFetch(
						statusURL.toString() as ErrorPagePath,
					);

					// In order for the response of the remote to be usable as a response
					// for this request, it needs to have our status code in the response
					// instead of the likely successful 200 code it returned when fetching
					// the error page.
					//
					// Furthermore, remote may have returned a compressed page
					// (the Content-Encoding header was set to e.g. `gzip`). The fetch
					// implementation in the `mergeResponses` method will make a decoded
					// response available, so Content-Length and Content-Encoding will
					// not match the body we provide and need to be removed.
					const override = { status, removeContentEncodingHeaders: true };

					const newResponse = mergeResponses(response, originalResponse, override);
					prepareResponse(newResponse, resolvedRenderOptions);
					return newResponse;
				} catch {
					// If the error page fetch fails (e.g. connection refused), fall
					// through to the plain error response below.
					const response = mergeResponses(new Response(null, { status }), originalResponse);
					prepareResponse(response, resolvedRenderOptions);
					return response;
				}
			}
		}
		const mod = await getEnvironment(manifest).getComponentByRoute(manifest, errorRouteData);
		const errorState = new FetchState(manifest, request);
		errorState.skipMiddleware = skipMiddleware;
		errorState.clientAddress = resolvedRenderOptions.clientAddress;
		errorState.routeData = errorRouteData;
		errorState.pathname = resolvedPathname;
		errorState.status = status;
		errorState.componentInstance = mod;
		errorState.locals = resolvedRenderOptions.locals ?? ({} as App.Locals);
		errorState.initialProps = { error };
		try {
			await provideSession(errorState);
			const response = await handleMiddleware(errorState, handlePages);
			// A middleware rewrite (`ctx.rewrite()` / `next(payload)`) issued while
			// rendering the error page swaps the state's routeData away from the
			// error route, so the rewrite target renders instead of 404/500.astro.
			// If that hijacked render produced another empty reroutable error
			// response, we'd return a blank page — retry rendering the error page
			// without middleware instead (same fallback used when middleware throws).
			// A rewrite that produced a real body is left untouched, so middleware
			// that intentionally rewrites error renders keeps working.
			if (
				rewroteToEmptyErrorResponse(skipMiddleware, errorRouteData, errorState.routeData, response)
			) {
				return renderDefaultError(manifest, request, {
					...resolvedRenderOptions,
					status,
					error,
					response: originalResponse,
					skipMiddleware: true,
					pathname: resolvedPathname,
				});
			}
			const newResponse = mergeResponses(response, originalResponse);
			prepareResponse(newResponse, resolvedRenderOptions);
			return newResponse;
		} catch {
			// Middleware may be the cause of the error, so we try rendering 404/500.astro without it.
			if (skipMiddleware === false) {
				return renderDefaultError(manifest, request, {
					...resolvedRenderOptions,
					status,
					error,
					response: originalResponse,
					skipMiddleware: true,
					pathname: resolvedPathname,
				});
			}
		} finally {
			await errorState.finalizeAll();
		}
	}

	const response = mergeResponses(new Response(null, { status }), originalResponse);
	prepareResponse(response, resolvedRenderOptions);
	return response;
}

function mergeResponses(
	newResponse: Response,
	originalResponse?: Response,
	override?: {
		status: 404 | 500;
		removeContentEncodingHeaders: boolean;
	},
) {
	let newResponseHeaders = newResponse.headers;

	// In order to set the body of a remote response as the new response body, we need to remove
	// headers about encoding in transit, as Node's standard fetch implementation `undici`
	// currently does not do so.
	//
	// Also see https://github.com/nodejs/undici/issues/2514
	if (override?.removeContentEncodingHeaders) {
		// The original headers are immutable, so we need to clone them here.
		newResponseHeaders = new Headers(newResponseHeaders);

		newResponseHeaders.delete('Content-Encoding');
		newResponseHeaders.delete('Content-Length');
	}

	if (!originalResponse) {
		if (override !== undefined) {
			return new Response(newResponse.body, {
				status: override.status,
				statusText: newResponse.statusText,
				headers: newResponseHeaders,
			});
		}
		return newResponse;
	}

	// If the new response did not have a meaningful status, an override may have been provided
	// If the original status was 200 (default), override it with the new status (probably 404 or 500)
	// Otherwise, the user set a specific status while rendering and we should respect that one
	const status = override?.status
		? override.status
		: originalResponse.status === 200
			? newResponse.status
			: originalResponse.status;

	try {
		// this function could throw an error if the headers are immutable...
		originalResponse.headers.delete('Content-type');
		// Framing headers describe the original response's body encoding/size and must
		// not carry over to the error page response which has a different body.
		originalResponse.headers.delete('Content-Length');
		originalResponse.headers.delete('Transfer-Encoding');
	} catch {
		// Headers may be immutable (e.g. when the Response was constructed by a fetch).
		// In that case, the loop below still copies from originalResponse.headers,
		// so we need to filter out framing headers there instead.
	}
	// Build merged headers using append() to preserve multi-value headers (e.g. Set-Cookie).
	// Headers from the original response take priority over new response headers for
	// single-value headers, but we use append to avoid collapsing multi-value entries.
	const newHeaders = new Headers();
	const seen = new Set<string>();
	// Add original response headers first (they take priority)
	for (const [name, value] of originalResponse.headers) {
		newHeaders.append(name, value);
		seen.add(name.toLowerCase());
	}
	// Add new response headers that weren't already set by the original response,
	// but skip content-type since the error page must return text/html.
	// set-cookie is special: it's a multi-value header, so we always append.
	for (const [name, value] of newResponseHeaders) {
		const lower = name.toLowerCase();
		if (!seen.has(lower) || lower === 'set-cookie') {
			newHeaders.append(name, value);
		}
	}
	const mergedResponse = new Response(newResponse.body, {
		status,
		statusText: status === 200 ? newResponse.statusText : originalResponse.statusText,
		// If you're looking at here for possible bugs, it means that it's not a bug.
		// With the middleware, users can meddle with headers, and we should pass to the 404/500.
		// If users see something weird, it's because they are setting some headers they should not.
		//
		// Although, we don't want it to replace the content-type, because the error page must return `text/html`
		headers: newHeaders,
	});

	// Transfer AstroCookies from the original or new response so that
	// prepareResponse can read them when addCookieHeader is true.
	const originalCookies = getCookiesFromResponse(originalResponse);
	const newCookies = getCookiesFromResponse(newResponse);
	if (originalCookies) {
		// If both responses have cookies, merge new response cookies into original
		if (newCookies) {
			originalCookies.merge(newCookies);
		}
		attachCookiesToResponse(mergedResponse, originalCookies);
	} else if (newCookies) {
		attachCookiesToResponse(mergedResponse, newCookies);
	}

	return mergedResponse;
}

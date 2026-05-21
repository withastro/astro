import type { BaseApp, RenderErrorOptions } from '../app/base.js';
import type { Pipeline } from '../base-pipeline.js';
import { FetchState } from '../fetch/fetch-state.js';
import { prepareResponse } from '../app/prepare-response.js';
import { attachCookiesToResponse } from '../cookies/index.js';
import { getCookiesFromResponse } from '../cookies/response.js';
import { AstroMiddleware } from '../middleware/astro-middleware.js';
import { PagesHandler } from '../pages/handler.js';
import { matchRoute } from '../routing/match.js';
import { provideSession } from '../session/handler.js';
import type { ErrorHandler } from './handler.js';

type ErrorPagePath =
	| `${string}/404`
	| `${string}/500`
	| `${string}/404/`
	| `${string}/500/`
	| `${string}404.html`
	| `${string}500.html`;

/**
 * The default error handler used in production SSR. Attempts to render the
 * matching error route (404.astro / 500.astro), falling back to a plain
 * response with the given status. Handles prerendered error pages via
 * `prerenderedErrorPageFetch`.
 */
export class DefaultErrorHandler implements ErrorHandler {
	#app: BaseApp<Pipeline>;
	#astroMiddleware: AstroMiddleware;
	#pagesHandler: PagesHandler;

	constructor(app: BaseApp<Pipeline>) {
		this.#app = app;
		this.#astroMiddleware = new AstroMiddleware(app.pipeline);
		this.#pagesHandler = new PagesHandler(app.pipeline);
	}

	async renderError(
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
		const app = this.#app;
		const resolvedPathname = pathname ?? new FetchState(app.pipeline, request).pathname;
		const errorRoutePath = `/${status}${app.manifest.trailingSlash === 'always' ? '/' : ''}`;
		const errorRouteData = matchRoute(errorRoutePath, app.manifestData);
		const url = new URL(request.url);
		if (errorRouteData) {
			if (errorRouteData.prerender) {
				const maybeDotHtml = errorRouteData.route.endsWith(`/${status}`) ? '.html' : '';
				const statusURL = new URL(`${app.baseWithoutTrailingSlash}/${status}${maybeDotHtml}`, url);
				if (
					statusURL.toString() !== request.url &&
					resolvedRenderOptions.prerenderedErrorPageFetch
				) {
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
				}
			}
			const mod = await app.pipeline.getComponentByRoute(errorRouteData);
			const errorState = new FetchState(app.pipeline, request);
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
				const response = await this.#astroMiddleware.handle(
					errorState,
					this.#pagesHandler.handle.bind(this.#pagesHandler),
				);
				const newResponse = mergeResponses(response, originalResponse);
				prepareResponse(newResponse, resolvedRenderOptions);
				return newResponse;
			} catch {
				// Middleware may be the cause of the error, so we try rendering 404/500.astro without it.
				if (skipMiddleware === false) {
					return this.renderError(request, {
						...resolvedRenderOptions,
						status,
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
	// but skip content-type since the error page must return text/html
	for (const [name, value] of newResponseHeaders) {
		if (!seen.has(name.toLowerCase())) {
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
			for (const cookieValue of newCookies.consume()) {
				originalResponse.headers.append('set-cookie', cookieValue);
			}
		}
		attachCookiesToResponse(mergedResponse, originalCookies);
	} else if (newCookies) {
		attachCookiesToResponse(mergedResponse, newCookies);
	}

	return mergedResponse;
}

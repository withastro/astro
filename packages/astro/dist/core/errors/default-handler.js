import { FetchState } from '../fetch/fetch-state.js';
import { prepareResponse } from '../app/prepare-response.js';
import { attachCookiesToResponse } from '../cookies/index.js';
import { getCookiesFromResponse } from '../cookies/response.js';
import { AstroMiddleware } from '../middleware/astro-middleware.js';
import { PagesHandler } from '../pages/handler.js';
import { matchRoute } from '../routing/match.js';
import { provideSession } from '../session/handler.js';
class DefaultErrorHandler {
	#app;
	#astroMiddleware;
	#pagesHandler;
	constructor(app) {
		this.#app = app;
		this.#astroMiddleware = new AstroMiddleware(app.pipeline);
		this.#pagesHandler = new PagesHandler(app.pipeline);
	}
	async renderError(
		request,
		{
			status,
			response: originalResponse,
			skipMiddleware = false,
			error,
			pathname,
			...resolvedRenderOptions
		},
	) {
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
					const response2 = await resolvedRenderOptions.prerenderedErrorPageFetch(
						statusURL.toString(),
					);
					const override = { status, removeContentEncodingHeaders: true };
					const newResponse = mergeResponses(response2, originalResponse, override);
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
			errorState.locals = resolvedRenderOptions.locals ?? {};
			errorState.initialProps = { error };
			try {
				await provideSession(errorState);
				const response2 = await this.#astroMiddleware.handle(
					errorState,
					this.#pagesHandler.handle.bind(this.#pagesHandler),
				);
				const newResponse = mergeResponses(response2, originalResponse);
				prepareResponse(newResponse, resolvedRenderOptions);
				return newResponse;
			} catch {
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
function mergeResponses(newResponse, originalResponse, override) {
	let newResponseHeaders = newResponse.headers;
	if (override?.removeContentEncodingHeaders) {
		newResponseHeaders = new Headers(newResponseHeaders);
		newResponseHeaders.delete('Content-Encoding');
		newResponseHeaders.delete('Content-Length');
	}
	if (!originalResponse) {
		if (override !== void 0) {
			return new Response(newResponse.body, {
				status: override.status,
				statusText: newResponse.statusText,
				headers: newResponseHeaders,
			});
		}
		return newResponse;
	}
	const status = override?.status
		? override.status
		: originalResponse.status === 200
			? newResponse.status
			: originalResponse.status;
	try {
		originalResponse.headers.delete('Content-type');
		originalResponse.headers.delete('Content-Length');
		originalResponse.headers.delete('Transfer-Encoding');
	} catch {}
	const newHeaders = new Headers();
	const seen = /* @__PURE__ */ new Set();
	for (const [name, value] of originalResponse.headers) {
		newHeaders.append(name, value);
		seen.add(name.toLowerCase());
	}
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
	const originalCookies = getCookiesFromResponse(originalResponse);
	const newCookies = getCookiesFromResponse(newResponse);
	if (originalCookies) {
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
export { DefaultErrorHandler };

import { NodeApp } from 'astro/app/node';
import { createRequestSafely, handleRequestCreationError } from './serve-utils.js';
import { requestAls } from './standalone.js';
import type { Options, RequestHandler } from './types.js';

/**
 * Creates a Node.js http listener for on-demand rendered pages, compatible with http.createServer and Connect middleware.
 * If the next callback is provided, it will be called if the request does not have a matching route.
 * Intended to be used in both standalone and middleware mode.
 */
export function createAppHandler(app: NodeApp, options: Options): RequestHandler {
	const originUrl = options.experimentalErrorPageHost
		? new URL(options.experimentalErrorPageHost)
		: undefined;

	const prerenderedErrorPageFetch = originUrl
		? (url: string) => {
				const errorPageUrl = new URL(url);
				errorPageUrl.protocol = originUrl.protocol;
				errorPageUrl.host = originUrl.host;
				return fetch(errorPageUrl);
			}
		: undefined;

	return async (req, res, next, locals) => {
		// Create Request object with proper error handling
		const { request, error: requestError } = createRequestSafely(req, app);
		if (!request) {
			handleRequestCreationError(req, res, requestError, app);
			return;
		}

		// Redirects are considered prerendered routes in static mode, but we want to
		// handle them dynamically, so prerendered routes are included here.
		const routeData = app.match(request, true);
		if (routeData) {
			const response = await requestAls.run(request.url, () =>
				app.render(request, {
					addCookieHeader: true,
					locals,
					routeData,
					prerenderedErrorPageFetch,
				}),
			);
			await NodeApp.writeResponse(response, res);
		} else if (next) {
			return next();
		} else {
			const response = await app.render(request, {
				addCookieHeader: true,
				prerenderedErrorPageFetch,
			});
			await NodeApp.writeResponse(response, res);
		}
	};
}

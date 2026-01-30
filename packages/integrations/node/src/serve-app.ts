import { AsyncLocalStorage } from 'node:async_hooks';
import { NodeApp } from 'astro/app/node';
import type { Options, RequestHandler } from './types.js';

/**
 * Creates a Node.js http listener for on-demand rendered pages, compatible with http.createServer and Connect middleware.
 * If the next callback is provided, it will be called if the request does not have a matching route.
 * Intended to be used in both standalone and middleware mode.
 */
export function createAppHandler(app: NodeApp, options: Options): RequestHandler {
	/**
	 * Keep track of the current request path using AsyncLocalStorage.
	 * Used to log unhandled rejections with a helpful message.
	 */
	const als = new AsyncLocalStorage<string>();
	const logger = app.getAdapterLogger();
	process.on('unhandledRejection', (reason) => {
		const requestUrl = als.getStore();
		logger.error(`Unhandled rejection while rendering ${requestUrl}`);
		console.error(reason);
	});

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
		let request: Request;
		try {
			request = NodeApp.createRequest(req, {
				allowedDomains: app.getAllowedDomains?.() ?? [],
			});
		} catch (err) {
			logger.error(`Could not render ${req.url}`);
			console.error(err);
			res.statusCode = 500;
			res.end('Internal Server Error');
			return;
		}

		// Redirects are considered prerendered routes in static mode, but we want to
		// handle them dynamically, so prerendered routes are included here.
		const routeData = app.match(request, true);
		if (routeData) {
			const response = await als.run(request.url, () =>
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
			const response = await app.render(req, { addCookieHeader: true, prerenderedErrorPageFetch });
			await NodeApp.writeResponse(response, res);
		}
	};
}

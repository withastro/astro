import { NodeApp } from 'astro/app/node';
import type { RequestHandler } from './types.js';

/**
 * Creates a Node.js http listener for on-demand rendered pages, compatible with http.createServer and Connect middleware.
 * If the next callback is provided, it will be called if the request does not have a matching route.
 * Intended to be used in both standalone and middleware mode.
 */
export function createAppHandler(app: NodeApp): RequestHandler {
	return async (req, res, next, locals) => {
		const request = NodeApp.createRequest(req);
		const routeData = app.match(request);
		if (routeData) {
			const response = await app.render(request, {
				addCookieHeader: true,
				locals,
				routeData,
			});
			await NodeApp.writeResponse(response, res);
		} else if (next) {
			return next();
		} else {
			const response = await app.render(req);
			await NodeApp.writeResponse(response, res);
		}
	};
}

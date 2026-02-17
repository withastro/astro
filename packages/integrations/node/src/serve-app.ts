import { createRequest, writeResponse } from 'astro/app/node';
import type { RequestHandler, Options } from './types.js';
import { createHandleRequestDeps, handleRequest } from './handler.js';
import type { BaseApp } from 'astro/app';

/**
 * Creates a Node.js http listener for on-demand rendered pages, compatible with http.createServer and Connect middleware.
 * If the next callback is provided, it will be called if the request does not have a matching route.
 * Intended to be used in both standalone and middleware mode.
 */
export function createAppHandler(
	app: BaseApp,
	options: Pick<Options, 'experimentalErrorPageHost' | 'server' | 'client'>,
): RequestHandler {
	const { als, prerenderedErrorPageFetch } = createHandleRequestDeps(app, options);

	return async (req, res, next, locals) => {
		let request: Request;
		try {
			request = createRequest(req, {
				allowedDomains: app.manifest.allowedDomains,
			});
		} catch (err) {
			app.getAdapterLogger().error(`Could not render ${req.url}`);
			console.error(err);
			res.statusCode = 500;
			res.end('Internal Server Error');
			return;
		}

		const response = await handleRequest({
			app,
			request,
			locals,
			next,
			als,
			prerenderedErrorPageFetch,
		});
		if (response instanceof Response) {
			await writeResponse(response, res);
		}
		// If not a response, it means next() has been called
	};
}

import type { NodeApp } from 'astro/app/node';
import { createAppHandler } from './serve-app.js';
import { createStaticHandler } from './serve-static.js';
import type { RequestHandler } from './types.js';

export function createStandaloneHandler(
	app: NodeApp,
	options: Parameters<typeof createAppHandler>[1] & Parameters<typeof createStaticHandler>[1],
): RequestHandler {
	const appHandler = createAppHandler(app, options);
	const staticHandler = createStaticHandler(app, options);
	return (req, res, next, locals) => {
		try {
			// validate request path
			decodeURI(req.url!);
		} catch {
			res.writeHead(400);
			res.end('Bad request.');
			return;
		}
		staticHandler(req, res, () => appHandler(req, res, next, locals));
	};
}

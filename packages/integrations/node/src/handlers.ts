import { createAppHandler } from './serve-app.js';
import { createStaticHandler } from './serve-static.js';
import type { RequestHandler } from './types.js';

export function createStandaloneHandler({
	app,
	experimentalErrorPageHost,
	assets,
	client,
	server,
	trailingSlash,
}: Parameters<typeof createAppHandler>[0] &
	Parameters<typeof createStaticHandler>[0]): RequestHandler {
	const appHandler = createAppHandler({ app, experimentalErrorPageHost, client, server });
	const staticHandler = createStaticHandler({ app, assets, client, server, trailingSlash });
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

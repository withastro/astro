import type { Options, RequestHandler } from './types.js';
import * as http from 'node:http';
import * as https from 'node:https';
import enableDestroy from 'server-destroy';
import * as fs from 'node:fs';
import type { NodeApp } from 'astro/app/node';
import { createAppHandler } from './serve-app.js';
import { createStaticHandler } from './serve-static.js';

// Used to get Host Value at Runtime
export function hostOptions(host: Options['host']): string {
	if (typeof host === 'boolean') {
		return host ? '0.0.0.0' : 'localhost';
	}
	return host;
}

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

// also used by preview entrypoint
export function createServer(listener: http.RequestListener) {
	let httpServer: http.Server | https.Server;

	if (process.env.SERVER_CERT_PATH && process.env.SERVER_KEY_PATH) {
		httpServer = https.createServer(
			{
				key: fs.readFileSync(process.env.SERVER_KEY_PATH),
				cert: fs.readFileSync(process.env.SERVER_CERT_PATH),
			},
			listener,
		);
	} else {
		httpServer = http.createServer(listener);
	}
	enableDestroy(httpServer);

	return httpServer;
}

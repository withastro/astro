import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import enableDestroy from 'server-destroy';
import { logListeningOn } from './log-listening-on.js';
import { createAppHandler } from './serve-app.js';
import { createStaticHandler } from './serve-static.js';
const hostOptions = (host) => {
	if (typeof host === 'boolean') {
		return host ? '0.0.0.0' : 'localhost';
	}
	return host;
};
function standalone(app, options, headersMap) {
	const port = process.env.PORT ? Number(process.env.PORT) : (options.port ?? 8080);
	const host = process.env.HOST ?? hostOptions(options.host);
	const resolvedOptions = { ...options, port };
	const handler = createStandaloneHandler(app, resolvedOptions, headersMap);
	const server = createServer(handler, host, port);
	server.server.listen(port, host);
	if (process.env.ASTRO_NODE_LOGGING !== 'disabled') {
		logListeningOn(app.adapterLogger, server.server, host);
	}
	server.server.on('close', () => {
		app.logger.close();
	});
	return {
		server,
		done: server.closed(),
	};
}
function createStandaloneHandler(app, options, headersMap) {
	const appHandler = createAppHandler(app, options);
	const staticHandler = createStaticHandler(app, options, headersMap);
	return (req, res) => {
		try {
			decodeURI(req.url);
		} catch {
			res.writeHead(400);
			res.end('Bad request.');
			return;
		}
		staticHandler(req, res, () => appHandler(req, res));
	};
}
function createServer(listener, host, port) {
	let httpServer;
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
	const closed = new Promise((resolve, reject) => {
		httpServer.addListener('close', resolve);
		httpServer.addListener('error', reject);
	});
	const previewable = {
		host,
		port,
		closed() {
			return closed;
		},
		async stop() {
			await new Promise((resolve, reject) => {
				httpServer.destroy((err) => (err ? reject(err) : resolve(void 0)));
			});
		},
	};
	return {
		server: httpServer,
		...previewable,
	};
}
export { createServer, createStandaloneHandler, standalone as default, hostOptions };

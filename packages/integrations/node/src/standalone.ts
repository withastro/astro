import type { AstroIntegrationLogger, PreviewServer } from 'astro';
import type { BaseApp } from 'astro/app';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import enableDestroy from 'server-destroy';
import { logListeningOn } from './log-listening-on.js';
import { createAppHandler } from './serve-app.js';
import { createStaticHandler } from './serve-static.js';
import type { NodeAppHeadersJson, Options } from './types.js';

// Used to get Host Value at Runtime
export const hostOptions = (host: Options['host']): string => {
	if (typeof host === 'boolean') {
		return host ? '0.0.0.0' : 'localhost';
	}
	return host;
};

export default function standalone(
	app: BaseApp,
	options: Options,
	headersMap: NodeAppHeadersJson | undefined,
) {
	const port = process.env.PORT ? Number(process.env.PORT) : (options.port ?? 8080);
	const host = process.env.HOST ?? hostOptions(options.host);
	// Ensure the resolved port (which may come from process.env.PORT) is used
	// by createRequest for origin construction, not just the build-time config port.
	// We spread a new object because `options` may be a frozen module namespace.
	const resolvedOptions = { ...options, port };
	const handler = createStandaloneHandler(app, resolvedOptions, headersMap);
	const server = createServer(handler, host, port);
	server.server.listen(port, host);
	if (process.env.ASTRO_NODE_LOGGING !== 'disabled') {
		// Resolve the logger before the 'listening' event fires so the startup message
		// uses the correct destination. standalone() stays synchronous so callers get
		// the server object immediately.
		app.getLogger().then(() => logListeningOn(app.adapterLogger, server.server, host));
	}
	server.server.on('close', () => {
		app.logger.close();
	});

	// A server-level error before 'listening' fires (e.g. EADDRINUSE) is a
	// fatal startup failure; after that it's a transient accept-time error
	// (e.g. EMFILE) the server can keep running through, so only log it.
	let listening = false;
	server.server.once('listening', () => (listening = true));
	server.server.on('error', (err: any) => {
		if (!listening) {
			app.adapterLogger.error(`Failed to start server: ${err.message}`);
			process.exit(1);
		}

		app.adapterLogger.error(`Server error: ${err.message}`);
	});

	addShutdownHandlers(options, server, app.adapterLogger);

	return {
		server,
		done: server.closed(),
	};
}

function addShutdownHandlers(
	options: Options,
	server: ReturnType<typeof createServer>,
	logger: AstroIntegrationLogger,
) {
	process.once('SIGTERM', () => shutdown('SIGTERM'));
	process.once('SIGINT', () => shutdown('SIGINT'));

	const finish = async () => {
		await server.closed();
		if (options.shutdown.exit) {
			process.exit(0);
		}
	};

	let shuttingDown = false;
	const shutdown = async (signal: string) => {
		if (shuttingDown) {
			return;
		}

		shuttingDown = true;

		const timeoutMs = options.shutdown.timeout;
		if (timeoutMs === 0) {
			logger.info(`Received ${signal}, shutting down immediately.`);
			server.server.destroy();
			await finish();
			return;
		}

		logger.info(`Received ${signal}, shutting down gracefully.`);
		server.server.close();

		if (timeoutMs === Number.POSITIVE_INFINITY) {
			await finish();
			return;
		}

		// Force-destroy remaining connections if drain takes too long.
		const timeout = setTimeout(() => {
			logger.warn(`Graceful shutdown timed out after ${timeoutMs}ms, forcing close.`);
			server.server.destroy();
			finish();
		}, timeoutMs);

		await finish();
		clearTimeout(timeout);
	};
}

// also used by server entrypoint
export function createStandaloneHandler(
	app: BaseApp,
	options: Options,
	headersMap: NodeAppHeadersJson | undefined,
) {
	const appHandler = createAppHandler(app, options);
	const staticHandler = createStaticHandler(app, options, headersMap);
	return (req: http.IncomingMessage, res: http.ServerResponse) => {
		try {
			// validate request path
			decodeURI(req.url!);
		} catch {
			res.writeHead(400);
			res.end('Bad request.');
			return;
		}
		staticHandler(req, res, () => appHandler(req, res));
	};
}

// also used by preview entrypoint
export function createServer(listener: http.RequestListener, host: string, port: number) {
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

	// Resolves once the server is closed
	// Close is always emitted when server.destroy() or server.close() is called
	const closed = new Promise<void>((resolve) => httpServer.once('close', resolve));

	const previewable = {
		host,
		port,
		closed() {
			return closed;
		},
		async stop() {
			await new Promise((resolve, reject) => {
				httpServer.destroy((err) => (err ? reject(err) : resolve(undefined)));
			});
		},
	} satisfies PreviewServer;

	return {
		server: httpServer,
		...previewable,
	};
}

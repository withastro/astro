import type { NodeApp } from 'astro/app/node';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from './http-server.js';
import middleware from './nodeMiddleware.js';
import type { Options } from './types';

function resolvePaths(options: Options) {
	const clientURLRaw = new URL(options.client);
	const serverURLRaw = new URL(options.server);
	const rel = path.relative(fileURLToPath(serverURLRaw), fileURLToPath(clientURLRaw));

	const serverEntryURL = new URL(import.meta.url);
	const clientURL = new URL(appendForwardSlash(rel), serverEntryURL);

	return {
		client: clientURL,
	};
}

function appendForwardSlash(pth: string) {
	return pth.endsWith('/') ? pth : pth + '/';
}

export function getResolvedHostForHttpServer(host: string | boolean) {
	if (host === false) {
		// Use a secure default
		return '127.0.0.1';
	} else if (host === true) {
		// If passed --host in the CLI without arguments
		return undefined; // undefined typically means 0.0.0.0 or :: (listen on all IPs)
	} else {
		return host;
	}
}

export default function startServer(app: NodeApp, options: Options) {
	const port = process.env.PORT ? Number(process.env.PORT) : options.port ?? 8080;
	const { client } = resolvePaths(options);
	const handler = middleware(app, options.mode);

	// Allow to provide host value at runtime
	const host = getResolvedHostForHttpServer(
		process.env.HOST !== undefined && process.env.HOST !== '' ? process.env.HOST : options.host
	);
	const server = createServer(
		{
			client,
			port,
			host,
			removeBase: app.removeBase.bind(app),
		},
		handler
	);

	const protocol = server.server instanceof https.Server ? 'https' : 'http';

	// eslint-disable-next-line no-console
	console.log(`Server listening on ${protocol}://${host}:${port}`);

	return {
		server,
		done: server.closed(),
	};
}

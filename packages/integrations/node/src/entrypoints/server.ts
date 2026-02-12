import { NodeApp } from 'astro/app/node';
import * as options from 'virtual:astro-node:config';
import { manifest } from 'virtual:astro:manifest';
import type { NodeAppHeadersJson } from 'astro';
import { logListeningOn } from '../log-listening-on.js';
import { createServer, createStandaloneHandler, hostOptions } from '../create-server.js';
import { setGetEnv } from 'astro/env/setup';
import { readHeadersJson } from '../shared.js';

const app = new NodeApp(manifest, !options.experimentalDisableStreaming);

export function startServer() {
	setGetEnv((key) => process.env[key]);

	let headersMap: NodeAppHeadersJson | undefined = undefined;
	if (options.staticHeaders) {
		headersMap = readHeadersJson(manifest.outDir);
	}

	if (headersMap) {
		app.setHeadersMap(headersMap);
	}

	const port = process.env.PORT ? Number(process.env.PORT) : options.port;
	const host = process.env.HOST ?? hostOptions(options.host);

	const server = createServer(createStandaloneHandler(app, options), host, port);
	server.server.listen(port, host);
	if (process.env.ASTRO_NODE_LOGGING !== 'disabled') {
		logListeningOn(app.getAdapterLogger(), server.server, host);
	}
	return {
		server,
		done: server.closed(),
	};
}

if (process.env.ASTRO_NODE_AUTOSTART !== 'disabled') {
	startServer();
}

export const handler = createStandaloneHandler(app, options);

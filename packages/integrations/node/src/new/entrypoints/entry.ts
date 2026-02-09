import { NodeApp } from 'astro/app/node';
import * as options from 'virtual:astro-node:config';
import { manifest } from 'virtual:astro:manifest';
import { createStandaloneHandler } from '../handlers.js';
import type { NodeAppHeadersJson } from 'astro';
import { logListeningOn } from '../../log-listening-on.js';
import { createServer, hostOptions } from '../server.js';
import { setGetEnv } from 'astro/env/setup';
import { STATIC_HEADERS_FILE } from '../../shared.js';
import { existsSync, readFileSync } from 'node:fs';

const app = new NodeApp(manifest, !options.experimentalDisableStreaming);

export function startServer() {
	// TODO: extract
	function readHeadersJson(outDir: string | URL): NodeAppHeadersJson | undefined {
		let headersMap: NodeAppHeadersJson | undefined = undefined;

		const headersUrl = new URL(STATIC_HEADERS_FILE, outDir);
		if (existsSync(headersUrl)) {
			const content = readFileSync(headersUrl, 'utf-8');
			try {
				headersMap = JSON.parse(content) as NodeAppHeadersJson;
			} catch (e: any) {
				console.error('[@astrojs/node] Error parsing _headers.json: ' + e.message);
				console.error('[@astrojs/node] Please make sure your _headers.json is valid JSON.');
			}
		}
		return headersMap;
	}

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

	const server = createServer(createStandaloneHandler({ app, ...options }), host, port);
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

export const handler = createStandaloneHandler({ app, ...options });

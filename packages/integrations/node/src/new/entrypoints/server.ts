import { NodeApp } from 'astro/app/node';
import * as options from 'virtual:astro-node:config';
import { manifest } from 'astro:ssr-manifest';
import { createStandaloneHandler } from '../handlers.js';
import type { NodeAppHeadersJson } from 'astro';

async function start() {
	const { logListeningOn } = await import('../../log-listening-on.js');
	const { createServer, hostOptions } = await import('../server.js');
	const { setGetEnv } = await import('astro/env/setup');
	const { STATIC_HEADERS_FILE } = await import('../../shared.js');
	const { existsSync, readFileSync } = await import('node:fs');

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

	const app = new NodeApp(manifest, !options.experimentalDisableStreaming);
	if (headersMap) {
		app.setHeadersMap(headersMap);
	}

	const port = process.env.PORT ? Number(process.env.PORT) : options.port;
	const host = process.env.HOST ?? hostOptions(options.host);

	const server = createServer(createStandaloneHandler({ app, ...options }));
	server.listen(port, host);
	if (process.env.ASTRO_NODE_LOGGING !== 'disabled') {
		logListeningOn(app.getAdapterLogger(), server, host);
	}
}

if (process.env.ASTRO_NODE_AUTOSTART !== 'disabled') {
	await start();
}

export let previewHandler!: ReturnType<typeof createStandaloneHandler>;

if (process.env.ASTRO_NODE_PREVIEW === 'true') {
	const app = new NodeApp(manifest, !options.experimentalDisableStreaming);
	previewHandler = createStandaloneHandler({ app, ...options });
}

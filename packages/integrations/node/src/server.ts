// Keep at the top
import './polyfill.js';

import type { SSRManifest, NodeAppHeadersJson } from 'astro';
import { NodeApp } from 'astro/app/node';
import { setGetEnv } from 'astro/env/setup';
import createMiddleware from './middleware.js';
import { createStandaloneHandler } from './standalone.js';
import startServer from './standalone.js';
import type { Options } from './types.js';
import { existsSync, readFileSync } from 'node:fs';
import { STATIC_HEADERS_FILE } from './shared.js';

setGetEnv((key) => process.env[key]);

export function createExports(manifest: SSRManifest, options: Options) {
	const app = new NodeApp(manifest);
	let headersMap: NodeAppHeadersJson | undefined = undefined;
	if (options.experimentalStaticHeaders) {
		headersMap = readHeadersJson(manifest.outDir);
	}

	if (headersMap) {
		app.setHeadersMap(headersMap);
	}
	options.trailingSlash = manifest.trailingSlash;
	return {
		options: options,
		handler:
			options.mode === 'middleware' ? createMiddleware(app) : createStandaloneHandler(app, options),
		startServer: () => startServer(app, options),
	};
}

export function start(manifest: SSRManifest, options: Options) {
	if (options.mode !== 'standalone' || process.env.ASTRO_NODE_AUTOSTART === 'disabled') {
		return;
	}

	let headersMap: NodeAppHeadersJson | undefined = undefined;
	if (options.experimentalStaticHeaders) {
		headersMap = readHeadersJson(manifest.outDir);
	}

	const app = new NodeApp(manifest);
	if (headersMap) {
		app.setHeadersMap(headersMap);
	}
	startServer(app, options);
}

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

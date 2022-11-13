import { polyfill } from 'virtual:@astrojs/webapi';
import type { SSRManifest } from 'astro';
import { NodeApp } from 'astro/app/node';
import middleware from './middleware.js';
import startServer from './standalone.js';
import type { Options } from './types';

polyfill(globalThis);

export function createExports(manifest: SSRManifest) {
	const app = new NodeApp(manifest);
	return {
		handler: middleware(app),
	};
}

export function start(manifest: SSRManifest, options: Options) {
	if (options.mode !== 'standalone' || process.env.ASTRO_NODE_AUTOSTART === 'disabled') {
		return;
	}

	const app = new NodeApp(manifest);
	startServer(app, options);
}

import { polyfill } from '@astrojs/webapi';
import type { SSRBaseManifest } from 'astro';
import { NodeApp } from 'astro/app/node';
import middleware from './nodeMiddleware.js';
import startServer from './standalone.js';
import type { Options } from './types';

polyfill(globalThis, {
	exclude: 'window document',
});

export function createExports(manifest: SSRBaseManifest, options: Options) {
	const app = new NodeApp(manifest);
	return {
		handler: middleware(app, options.mode),
		startServer: () => startServer(app, options),
	};
}

export function start(manifest: SSRBaseManifest, options: Options) {
	if (options.mode !== 'standalone' || process.env.ASTRO_NODE_AUTOSTART === 'disabled') {
		return;
	}

	const app = new NodeApp(manifest);
	startServer(app, options);
}

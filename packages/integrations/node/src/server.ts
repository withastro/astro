import type { SSRManifest } from 'astro';
import { NodeApp, applyPolyfills } from 'astro/app/node';
import createMiddleware from './middleware.js';
import { createStandaloneHandler } from './standalone.js';
import startServer from './standalone.js';
import type { Options } from './types.js';
// This needs to run first because some internals depend on `crypto`
applyPolyfills();

// Won't throw if the virtual module is not available because it's not supported in
// the users's astro version or if astro:env is not enabled in the project
await import('astro/env/setup')
	.then((mod) => mod.setGetEnv((key) => process.env[key]))
	.catch(() => {});

export function createExports(manifest: SSRManifest, options: Options) {
	const app = new NodeApp(manifest);
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

	const app = new NodeApp(manifest);
	startServer(app, options);
}

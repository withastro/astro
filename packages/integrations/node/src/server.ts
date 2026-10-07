import { createApp } from 'astro/app/entrypoint';
import { setGetEnv } from 'astro/env/setup';
import * as options from 'virtual:astro-node:config';
import createMiddleware from './middleware.js';
import { readHeadersJson } from './shared.js';
import _startServer, { createStandaloneHandler } from './standalone.js';

setGetEnv((key) => process.env[key]);

const app = createApp({ streaming: !options.experimentalDisableStreaming });

const headersMap = options.staticHeaders ? readHeadersJson(app.manifest.outDir) : undefined;

export { options };

export const handler =
	options.mode === 'middleware'
		? createMiddleware(app, options)
		: createStandaloneHandler(app, options, headersMap);

export const startServer = () => _startServer(app, options, headersMap);

if (options.mode === 'standalone' && process.env.ASTRO_NODE_AUTOSTART !== 'disabled') {
	startServer().done.catch((error) => {
		// The server's `error` event (e.g. EADDRINUSE) rejects `done`. Report it and exit
		// non-zero, because the adapter's `unhandledRejection` listener would otherwise
		// swallow it and let the process exit cleanly. See #18282.
		app.adapterLogger.error(error instanceof Error ? error.stack || error.message : String(error));
		process.exitCode = 1;
	});
}

import { createApp } from 'astro/app/entrypoint';
import { setGetEnv } from 'astro/env/setup';
import * as options from 'virtual:astro-node:config';
import createMiddleware from './middleware.js';
import { readHeadersJson } from './shared.js';
import _startServer, { createStandaloneHandler } from './standalone.js';
import { createUpgradeHandler } from './websocket.js';

setGetEnv((key) => process.env[key]);

const app = createApp({ streaming: !options.experimentalDisableStreaming });

const headersMap = options.staticHeaders ? readHeadersJson(app.manifest.outDir) : undefined;

export { options };

export const handler =
	options.mode === 'middleware'
		? createMiddleware(app, options)
		: createStandaloneHandler(app, options, headersMap);

/**
 * Listener for the server's `upgrade` event when `experimental.websocket` is enabled.
 * In middleware mode, attach it to your own server: `server.on('upgrade', upgradeHandler)`.
 */
export const upgradeHandler = options.experimentalWebSocket
	? createUpgradeHandler(app, options)
	: undefined;

export const startServer = () => _startServer(app, options, headersMap);

if (options.mode === 'standalone' && process.env.ASTRO_NODE_AUTOSTART !== 'disabled') {
	const { done } = startServer();
	done.catch((err) => {
		console.error(err);
		process.exit(1);
	});
}

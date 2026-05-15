import { createApp } from 'astro/app/entrypoint';
import { setGetEnv } from 'astro/env/setup';
import * as options from 'virtual:astro-node:config';
import createMiddleware from './middleware.js';
import { readHeadersJson } from './shared.js';
import _startServer, { createStandaloneHandler } from './standalone.js';
setGetEnv((key) => process.env[key]);
const app = createApp({ streaming: !options.experimentalDisableStreaming });
const headersMap = options.staticHeaders ? readHeadersJson(app.manifest.outDir) : void 0;
const handler =
	options.mode === 'middleware'
		? createMiddleware(app, options)
		: createStandaloneHandler(app, options, headersMap);
const startServer = () => _startServer(app, options, headersMap);
if (options.mode === 'standalone' && process.env.ASTRO_NODE_AUTOSTART !== 'disabled') {
	startServer();
}
export { handler, options, startServer };

import { createApp } from 'astro/app/entrypoint';
import { setGetEnv } from 'astro/env/setup';
import { mustValidate, schema } from 'virtual:astro-node:env-schema';
import * as options from 'virtual:astro-node:config';
import createMiddleware from './middleware.js';
import { readHeadersJson, checkEnv } from './shared.js';
import _startServer, { createStandaloneHandler } from './standalone.js';

setGetEnv((key) => process.env[key]);

const app = createApp({ streaming: !options.experimentalDisableStreaming });

if (mustValidate) {
	checkEnv(app.adapterLogger, schema, true);
}
const headersMap = options.staticHeaders ? readHeadersJson(app.manifest.outDir) : undefined;

export { options, createApp };

export const handler =
	options.mode === 'middleware'
		? createMiddleware(app, options)
		: createStandaloneHandler(app, options, headersMap);

export const startServer = () => _startServer(app, options, headersMap);

if (options.mode === 'standalone' && process.env.ASTRO_NODE_AUTOSTART !== 'disabled') {
	startServer();
}

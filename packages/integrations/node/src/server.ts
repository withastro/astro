import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createApp } from 'astro/app/entrypoint';
import { setGetEnv } from 'astro/env/setup';
import * as options from 'virtual:astro-node:config';
import createMiddleware from './middleware.js';
import { readHeadersJson } from './shared.js';
import _startServer, { createStandaloneHandler } from './standalone.js';

setGetEnv((key) => process.env[key]);

const app = createApp({ streaming: !options.experimentalDisableStreaming });

// Resolve the session storage base path at runtime. The manifest stores a path
// relative to the project root (e.g., "node_modules/.astro/sessions") for
// portability. Resolve it against manifest.rootDir which is itself resolved
// from import.meta.url — so it points to the correct location as long as
// node_modules/ is co-located with dist/.
if (app.manifest.sessionConfig?.options?.base && !path.isAbsolute(app.manifest.sessionConfig.options.base)) {
	app.manifest.sessionConfig.options.base = fileURLToPath(
		new URL(app.manifest.sessionConfig.options.base, app.manifest.rootDir),
	);
}

const headersMap = options.staticHeaders ? readHeadersJson(app.manifest.outDir) : undefined;

export { options };

export const handler =
	options.mode === 'middleware'
		? createMiddleware(app, options)
		: createStandaloneHandler(app, options, headersMap);

export const startServer = () => _startServer(app, options, headersMap);

if (options.mode === 'standalone' && process.env.ASTRO_NODE_AUTOSTART !== 'disabled') {
	startServer();
}

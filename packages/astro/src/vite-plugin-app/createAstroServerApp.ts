import type http from 'node:http';
import { createRequest } from '../core/request.js';
import { makeRequestBody, writeResponse } from '../core/app/node.js';
import { getViteErrorPayload } from '../core/errors/dev/index.js';
import { createSafeError, type ErrorWithMetadata } from '../core/errors/index.js';
import { Logger } from '../core/logger/core.js';
import { nodeLogDestination } from '../core/logger/node.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import type { AstroSettings } from '../types/astro.js';
import type { DevServerController } from '../vite-plugin-astro-server/controller.js';
import { ASTRO_DEV_USER_APP_ID } from './index.js';

export default async function createAstroServerApp(
	_controller: DevServerController,
	settings: AstroSettings,
	loader: ModuleLoader,
	logger?: Logger,
) {
	const actualLogger =
		logger ??
		new Logger({
			dest: nodeLogDestination,
			level: settings.logLevel,
		});

	return {
		handler(incomingRequest: http.IncomingMessage, incomingResponse: http.ServerResponse) {
			loader
				.import(ASTRO_DEV_USER_APP_ID)
				.then(async (userAppModule) => {
					const userApp = userAppModule.default as
						| { fetch: (request: Request) => Promise<Response> }
						| undefined;

					// Construct URL using Host header (includes port in dev)
					const isHttps = 'encrypted' in incomingRequest.socket && incomingRequest.socket.encrypted;
					const protocol = isHttps ? 'https' : 'http';
					const host = incomingRequest.headers.host ?? 'localhost';
					const url = new URL(`${protocol}://${host}${incomingRequest.url}`);

					// Get body using the helper that handles async iterables properly (only for non-GET/HEAD)
					const bodyInit =
						incomingRequest.method === 'GET' || incomingRequest.method === 'HEAD'
							? undefined
							: makeRequestBody(incomingRequest);

					const request = createRequest({
						url,
						headers: incomingRequest.headers,
						method: incomingRequest.method,
						logger: actualLogger,
						routePattern: 'src/app.ts',
						init: bodyInit as RequestInit | undefined,
					});

					if (!userApp || typeof userApp.fetch !== 'function') {
						throw new Error('src/app.ts must default export a Hono app instance.');
					}

					const response = await userApp.fetch(request);
					await writeResponse(response, incomingResponse);
				})
				.catch(async (error) => {
					actualLogger.error('router', error?.stack || error?.message || String(error));
					const safeError = createSafeError(error) as ErrorWithMetadata;
					// Send the Vite error overlay via WebSocket so the browser displays it
					incomingResponse.on('close', async () => {
						setTimeout(
							async () => loader.webSocketSend(await getViteErrorPayload(safeError)),
							200,
						);
					});
					if (incomingResponse.headersSent) {
						incomingResponse.write(
							`<script type="module" src="/@vite/client"></script>`,
						);
						incomingResponse.end();
					} else {
						const html = `<title>${safeError.name}</title><script type="module" src="/@vite/client"></script>`;
						incomingResponse.writeHead(500, {
							'Content-Type': 'text/html',
							'Content-Length': Buffer.byteLength(html, 'utf-8'),
						});
						incomingResponse.write(html);
						incomingResponse.end();
					}
				});
		},
	};
}

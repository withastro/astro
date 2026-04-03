import type http from 'node:http';
import type { ServerResponse } from 'node:http';
import { routes } from 'virtual:astro:routes';
import { createRequest } from '../core/request.js';
import { createOutgoingHttpHeaders } from '../core/app/createOutgoingHttpHeaders.js';
import { makeRequestBody } from '../core/app/node.js';
import type { RouteInfo } from '../core/app/types.js';
import { getViteErrorPayload } from '../core/errors/dev/index.js';
import { createSafeError, type ErrorWithMetadata } from '../core/errors/index.js';
import { Logger } from '../core/logger/core.js';
import { nodeLogDestination } from '../core/logger/node.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
import type { DevServerController } from '../vite-plugin-astro-server/controller.js';
import { ASTRO_DEV_USER_APP_ID } from './index.js';

/**
 * Writes a Response to a ServerResponse, handling stream errors gracefully
 * by injecting the Vite error overlay script instead of destroying the socket.
 */
async function writeDevResponse(
	source: Response,
	destination: ServerResponse,
	loader: ModuleLoader,
) {
	const { status, headers, body } = source;
	destination.writeHead(status, createOutgoingHttpHeaders(headers));
	if (!body) return destination.end();
	try {
		const reader = body.getReader();
		destination.on('close', () => {
			reader.cancel().catch(() => {});
		});
		let result = await reader.read();
		while (!result.done) {
			destination.write(result.value);
			result = await reader.read();
		}
		destination.end();
	} catch (err) {
		// Stream error (e.g. a component threw mid-render). Instead of destroying
		// the socket, inject the Vite error overlay so the browser can display it.
		try {
			const safeError = createSafeError(err) as ErrorWithMetadata;
			destination.write(`<script type="module" src="/@vite/client"></script>`);
			destination.end();
			setTimeout(async () => {
				try {
					loader.webSocketSend(await getViteErrorPayload(safeError));
				} catch {}
			}, 200);
		} catch {
			destination.end();
		}
	}
}

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

	// Capture the initial routes from virtual:astro:routes, which is imported
	// at the top of this file (eagerly, during createHandler). This ensures we
	// get the correct routes before file watchers fire and mutate the route list.
	const routesList: RoutesList = { routes: routes.map((r: RouteInfo) => r.routeData) };
	let routesSynced = false;

	return {
		handler(incomingRequest: http.IncomingMessage, incomingResponse: http.ServerResponse) {
			// Set user-specified server headers on every response
			for (const [name, value] of Object.entries(settings.config.server.headers ?? {})) {
				if (value) incomingResponse.setHeader(name, value);
			}

			Promise.resolve()
				.then(async () => {
					const mod = await loader.import(ASTRO_DEV_USER_APP_ID);

					// On first request, sync the initial routes captured at createHandler
					// time into the DevApp. The routes were imported eagerly (at the top
					// of this file) during createHandler, before file watchers could mutate
					// the route list. dev.ts may have loaded virtual:astro:routes later
					// with stale data, so we re-apply the correct routes here.
					if (!routesSynced) {
						routesSynced = true;
						const { app: devApp } = await loader.import('virtual:astro:app');
						if (devApp && typeof devApp.updateRoutes === 'function') {
							devApp.updateRoutes(routesList);
						}
					}

					const userApp = mod.default as
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
					await writeDevResponse(response, incomingResponse, loader);
				})
				.catch(async (error) => {
					actualLogger.error('router', error?.stack || error?.message || String(error));
					try {
						const safeError = createSafeError(error) as ErrorWithMetadata;
						// Send the Vite error overlay via WebSocket so the browser displays it
						incomingResponse.on('close', async () => {
							setTimeout(
								async () => loader.webSocketSend(await getViteErrorPayload(safeError)),
								200,
							);
						});
						if (incomingResponse.closed || incomingResponse.writableEnded) {
							return;
						}
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
					} catch {
						// If writing the error response fails, just destroy the socket
						if (!incomingResponse.closed) {
							incomingResponse.destroy();
						}
					}
				});
		},
	};
}

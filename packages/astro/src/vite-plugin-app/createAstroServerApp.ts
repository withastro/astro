import type http from 'node:http';
import { app as astroApp } from 'virtual:astro:app';
import { createRequest, writeResponse } from '../core/app/node.js';
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
					const request = createRequest(incomingRequest, {
						allowedDomains: astroApp.getAllowedDomains?.() ?? [],
					});

					if (!userApp || typeof userApp.fetch !== 'function') {
						throw new Error('src/app.ts must default export a Hono app instance.');
					}

					const response = await userApp.fetch(request);
					await writeResponse(response, incomingResponse);
				})
				.catch((error) => {
					actualLogger.error('router', error?.stack || error?.message || String(error));
					incomingResponse.statusCode = 500;
					incomingResponse.end('Internal Server Error');
				});
		},
	};
}

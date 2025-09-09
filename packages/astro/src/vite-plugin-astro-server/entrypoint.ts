// @ts-expect-error
import { routes } from 'astro:routes';
// @ts-expect-error
import { manifest } from 'astro:serialized-manifest';
import type http from 'node:http';
import type { RouteInfo } from '../core/app/types.js';
import { Logger } from '../core/logger/core.js';
import { nodeLogDestination } from '../core/logger/node.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
import { DevApp } from './app.js';
import type { DevServerController } from './controller.js';

export default async function createExports(
	settings: AstroSettings,
	controller: DevServerController,
	loader: ModuleLoader,
) {
	const logger = new Logger({
		dest: nodeLogDestination,
		level: 'info',
	});
	const routesList: RoutesList = { routes: routes.map((r: RouteInfo) => r.routeData) };
	const app = await DevApp.create(manifest, routesList, settings, logger, loader);

	return {
		handler(incomingRequest: http.IncomingMessage, incomingResponse: http.ServerResponse) {
			app.handleRequest({
				controller,
				incomingRequest,
				incomingResponse,
				isHttps: loader.isHttps(),
			});
		},
	};
}

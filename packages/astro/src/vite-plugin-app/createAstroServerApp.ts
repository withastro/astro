import type http from 'node:http';
import { manifest } from 'virtual:astro:manifest';
import { routes } from 'virtual:astro:routes';
import type { RouteInfo } from '../core/app/types.js';
import { Logger } from '../core/logger/core.js';
import { nodeLogDestination } from '../core/logger/node.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
import type { DevServerController } from '../vite-plugin-astro-server/controller.js';
import { AstroServerApp } from './app.js';

export default async function createAstroServerApp(
	controller: DevServerController,
	settings: AstroSettings,
	loader: ModuleLoader,
) {
	const logger = new Logger({
		dest: nodeLogDestination,
		level: 'info',
	});
	const routesList: RoutesList = { routes: routes.map((r: RouteInfo) => r.routeData) };

	const app = await AstroServerApp.create(manifest, routesList, logger, loader, settings);
	return {
		handler(incomingRequest: http.IncomingMessage, incomingResponse: http.ServerResponse) {
			app.handleRequest({
				controller,
				incomingRequest,
				incomingResponse,
				isHttps: loader?.isHttps() ?? false,
			});
		},
	};
}

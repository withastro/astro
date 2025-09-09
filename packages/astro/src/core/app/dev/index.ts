// @ts-expect-error This is a virtual module
import { routes } from 'astro:routes';
// @ts-expect-error This is a virtual module
import { manifest } from 'astro:serialized-manifest';
import type http from 'node:http';
import type { AstroSettings, RoutesList } from '../../../types/astro.js';
import type { DevServerController } from '../../../vite-plugin-astro-server/controller.js';
import { Logger } from '../../logger/core.js';
import { nodeLogDestination } from '../../logger/node.js';
import type { ModuleLoader } from '../../module-loader/index.js';
import type { RouteInfo } from '../types.js';
import { DevApp } from './app.js';

export { DevApp };

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

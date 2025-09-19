/// <reference types="vite/client" />

import type { ExportedHandler } from '@cloudflare/workers-types';
import type { RouteInfo, SSRManifest } from 'astro';
import { App, type BaseApp, createConsoleLogger, DevApp, type RoutesList } from 'astro/app';
import { type Env, handle } from '../utils/handler.js';

export function createExports(manifest: SSRManifest, routes: RouteInfo[]) {
	let app: BaseApp;

	if (import.meta.env.DEV) {
		const routesList: RoutesList = { routes: routes.map((r: RouteInfo) => r.routeData) };
		const logger = createConsoleLogger('debug');
		app = new DevApp(manifest, true, logger, routesList);
	} else {
		app = new App(manifest);
	}
	return {
		default: {
			async fetch(request, env, ctx) {
				return await handle(manifest, app, request, env, ctx);
			},
		} satisfies ExportedHandler<Env>,
	};
}

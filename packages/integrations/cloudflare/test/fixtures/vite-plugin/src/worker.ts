import type { SSRManifest } from 'astro';
import { handle, type Env } from '@astrojs/cloudflare/handler'
import type { ExportedHandler } from '@cloudflare/workers-types';
import type { RouteInfo } from 'astro';
import  { DevApp, createConsoleLogger } from 'astro/app';
import type { RoutesList } from 'astro/dist/types/astro.ts';


export function createExports(manifest: SSRManifest, routes: RouteInfo[]) {
	const routesList: RoutesList = { routes: routes.map((r: RouteInfo) => r.routeData) };
	const logger = createConsoleLogger('debug');
	const app = new DevApp(manifest, true, logger, routesList)
	return {
		default: {
			async fetch(request, env, ctx) {
				return await handle(manifest, app, request, env, ctx);
			},
		} satisfies ExportedHandler<Env>,
	}
}

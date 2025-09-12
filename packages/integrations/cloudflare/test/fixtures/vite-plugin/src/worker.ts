import type { SSRManifest } from 'astro';
import { handle, type Env } from '@astrojs/cloudflare/handler'
import type { ExportedHandler } from '@cloudflare/workers-types';
import { DevApp } from 'astro/app/dev';
import type { RouteInfo } from 'astro';
import { createConsoleLogger } from 'astro/config';

export async function createExports(manifest: SSRManifest, routes: RouteInfo[]) {
	const routesList = { routes: routes.map((r: RouteInfo) => r.routeData) };
	const logger = createConsoleLogger("info");
	const app = await DevApp.create(manifest, routesList, logger);
	return {
		default: {
			async fetch(request, env, ctx) {
				return await handle(manifest, app, request, env, ctx);
			},
		} satisfies ExportedHandler<Env>,
	}
}

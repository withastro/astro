import type { SSRManifest } from 'astro';

import { App } from 'astro/app';
import { handle, type Env } from '@astrojs/cloudflare/handler'
import type { ExportedHandler } from '@cloudflare/workers-types';

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);
	return {
		default: {
			async fetch(request, env, ctx) {
				return await handle(manifest, app, request, env, ctx);
			},
		} satisfies ExportedHandler<Env>,
	}
}

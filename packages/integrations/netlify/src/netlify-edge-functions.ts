import './edge-shim.js';
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);

	const handler = async (request: Request): Promise<Response | void> => {
		const url = new URL(request.url);

		// If this matches a static asset, just return and Netlify will forward it
		// to its static asset handler.
		if (manifest.assets.has(url.pathname)) {
			return;
		}
		if (app.match(request)) {
			return app.render(request);
		}

		return new Response(null, {
			status: 404,
			statusText: 'Not found',
		});
	};

	return { default: handler };
}

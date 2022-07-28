import type { SSRManifest } from 'astro';
import { App } from 'astro/app';

const clientAddressSymbol = Symbol.for('astro.clientAddress');

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
			const ip = request.headers.get('x-nf-client-connection-ip');
			Reflect.set(request, clientAddressSymbol, ip);
			return app.render(request);
		}

		return new Response(null, {
			status: 404,
			statusText: 'Not found',
		});
	};

	return { default: handler };
}

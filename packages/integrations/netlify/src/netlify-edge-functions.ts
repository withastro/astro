import type { Context } from '@netlify/edge-functions';
import type { SSRBaseManifest } from 'astro';
import { App } from 'astro/app';

const clientAddressSymbol = Symbol.for('astro.clientAddress');

export function createExports(manifest: SSRBaseManifest) {
	const app = new App(manifest);

	const handler = async (request: Request, context: Context): Promise<Response | void> => {
		const url = new URL(request.url);

		// If this matches a static asset, just return and Netlify will forward it
		// to its static asset handler.
		if (manifest.assets.has(url.pathname)) {
			return;
		}
		if (app.match(request)) {
			const ip =
				request.headers.get('x-nf-client-connection-ip') ||
				context?.ip ||
				(context as any)?.remoteAddr?.hostname;
			Reflect.set(request, clientAddressSymbol, ip);
			const response = await app.render(request);
			if (app.setCookieHeaders) {
				for (const setCookieHeader of app.setCookieHeaders(response)) {
					response.headers.append('Set-Cookie', setCookieHeader);
				}
			}
			return response;
		}

		return new Response(null, {
			status: 404,
			statusText: 'Not found',
		});
	};

	return { default: handler };
}

import type { Context } from '@netlify/edge-functions';
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';

const clientAddressSymbol = Symbol.for('astro.clientAddress');

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);

	const handler = async (request: Request, context: Context): Promise<Response | void> => {
		const url = new URL(request.url);

		// If this matches a static asset, just return and Netlify will forward it
		// to its static asset handler.
		if (manifest.assets.has(url.pathname)) {
			return;
		}
		const routeData = app.match(request)
		const ip =
			request.headers.get('x-nf-client-connection-ip') ||
			context?.ip ||
			(context as any)?.remoteAddr?.hostname;
		Reflect.set(request, clientAddressSymbol, ip);
		const response = await app.render(request, routeData);
		if (app.setCookieHeaders) {
			for (const setCookieHeader of app.setCookieHeaders(response)) {
				response.headers.append('Set-Cookie', setCookieHeader);
			}
		}
		return response;
	};

	return { default: handler };
}

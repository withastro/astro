// NOTE(fks): Side-effect -- shim.js must run first. This isn't guaranteed by
// the language, but it is a Node.js behavior that we rely on here. Keep this
// separate from the other imports so that it doesn't get organized & reordered.
import './shim.js';

// Normal Imports
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';

const clientAddressSymbol = Symbol.for('astro.clientAddress');

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);

	const handler = async (request: Request): Promise<Response> => {
		const routeData = app.match(request);
		Reflect.set(request, clientAddressSymbol, request.headers.get('x-forwarded-for'));
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

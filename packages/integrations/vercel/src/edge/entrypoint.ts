// NOTE(fks): Side-effect -- shim.js must run first. This isn't guaranteed by
// the language, but it is a Node.js behavior that we rely on here. Keep this
// separate from the other imports so that it doesn't get organized & reordered.
import './shim.js';

// Normal Imports
import type { SSRBaseManifest } from 'astro';
import { App } from 'astro/app';

const clientAddressSymbol = Symbol.for('astro.clientAddress');

export function createExports(manifest: SSRBaseManifest) {
	const app = new App(manifest);

	const handler = async (request: Request): Promise<Response> => {
		if (app.match(request)) {
			Reflect.set(request, clientAddressSymbol, request.headers.get('x-forwarded-for'));
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

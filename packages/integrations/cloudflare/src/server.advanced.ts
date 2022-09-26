import './shim.js';

import type { SSRManifest } from 'astro';
import { App, getSetCookiesFromResponse } from 'astro/app';

type Env = {
	ASSETS: { fetch: (req: Request) => Promise<Response> };
};

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest, false);

	const fetch = async (request: Request, env: Env) => {
		const { origin, pathname } = new URL(request.url);

		// static assets
		if (manifest.assets.has(pathname)) {
			const assetRequest = new Request(`${origin}/static${pathname}`, request);
			return env.ASSETS.fetch(assetRequest);
		}

		let routeData = app.match(request, { matchNotFound: true });
		if (routeData) {
			Reflect.set(
				request,
				Symbol.for('astro.clientAddress'),
				request.headers.get('cf-connecting-ip')
			);
			let response = await app.render(request, routeData);

			if(app.setCookieHeaders) {
				for(const setCookieHeader of app.setCookieHeaders(response)) {
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

	return { default: { fetch } };
}

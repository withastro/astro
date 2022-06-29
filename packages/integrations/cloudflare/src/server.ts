import './shim.js';

import type { SSRManifest } from 'astro';
import { App } from 'astro/app';

type Env = {
	ASSETS: { fetch: (req: Request) => Promise<Response> };
};

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);

	const fetch = async (request: Request, env: Env) => {
		const { origin, pathname } = new URL(request.url);

		// static assets
		if (manifest.assets.has(pathname)) {
			const assetRequest = new Request(`${origin}/static${pathname}`, request);
			return env.ASSETS.fetch(assetRequest);
		}

		if (app.match(request)) {
			return app.render(request);
		}

		// 404
		const _404Request = new Request(`${origin}/404`, request);
		if (app.match(_404Request)) {
			return app.render(_404Request);
		}

		return new Response(null, {
			status: 404,
			statusText: 'Not found',
		});
	};

	return { default: { fetch } };
}

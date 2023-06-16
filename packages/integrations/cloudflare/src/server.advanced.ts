import type { Request as CFRequest } from '@cloudflare/workers-types';
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';
import { getProcessEnvProxy, isNode } from './util.js';

if (!isNode) {
	process.env = getProcessEnvProxy();
}

type Env = {
	ASSETS: { fetch: (req: Request) => Promise<Response> };
	name: string;
};

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);

	const fetch = async (request: Request & CFRequest, env: Env, context: any) => {
		process.env = env as any;

		const { pathname } = new URL(request.url);

		// static assets fallback, in case default _routes.json is not used
		if (manifest.assets.has(pathname)) {
			return env.ASSETS.fetch(request);
		}

		let routeData = app.match(request, { matchNotFound: true });
		if (routeData) {
			Reflect.set(
				request,
				Symbol.for('astro.clientAddress'),
				request.headers.get('cf-connecting-ip')
			);
			Reflect.set(request, Symbol.for('runtime'), {
				env,
				name: 'cloudflare',
				caches,
				cf: request.cf,
				...context,
			});
			let response = await app.render(request, routeData);

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

	return { default: { fetch } };
}

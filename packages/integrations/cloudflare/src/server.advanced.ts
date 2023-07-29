import type { Request as CFRequest, ExecutionContext } from '@cloudflare/workers-types';
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

	const fetch = async (request: Request & CFRequest, env: Env, context: ExecutionContext) => {
		process.env = env as any; // would love to remove this any cast in the future

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

			// @deprecated: getRuntime() can be removed, Astro.locals.env is the new place
			Reflect.set(request, Symbol.for('runtime'), {
				env,
				name: 'cloudflare',
				caches,
				cf: request.cf,
				...context,
				waitUntil: (promise: Promise<any>) => {
					context.waitUntil(promise);
				},
			});

			let response = await app.render(request, routeData, {
				runtime: {
					// request: Request; // not needed because we have Astro.request, thus they are minor differences
					// functionPath: string; // not needed
					waitUntil: (promise: Promise<any>) => {
						context.waitUntil(promise);
					},
					// passThroughOnException: () => void; // probably not needed ??
					env: env,
					cf: request.cf,
					caches: caches,
				},
			});

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

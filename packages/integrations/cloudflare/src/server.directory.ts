import type { EventContext, Request as CFRequest } from '@cloudflare/workers-types';
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';
import { getProcessEnvProxy, isNode } from './util.js';

if (!isNode) {
	process.env = getProcessEnvProxy();
}

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);

	const onRequest = async ({
		request,
		next,
		...runtimeEnv
	}: {
		request: Request & CFRequest;
		next: (request: Request) => void;
		waitUntil: EventContext<unknown, any, unknown>['waitUntil'];
	} & Record<string, unknown>) => {
		process.env = runtimeEnv.env as any;

		const { pathname } = new URL(request.url);
		// static assets fallback, in case default _routes.json is not used
		if (manifest.assets.has(pathname)) {
			return next(request);
		}

		let routeData = app.match(request, { matchNotFound: true });
		if (routeData) {
			Reflect.set(
				request,
				Symbol.for('astro.clientAddress'),
				request.headers.get('cf-connecting-ip')
			);
			Reflect.set(request, Symbol.for('runtime'), {
				...runtimeEnv,
				waitUntil: (promise: Promise<any>) => {
					runtimeEnv.waitUntil(promise);
				},
				name: 'cloudflare',
				next,
				caches,
				cf: request.cf,
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

	return { onRequest, manifest };
}

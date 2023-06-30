import type { Request as CFRequest, EventContext } from '@cloudflare/workers-types';
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';
import { getProcessEnvProxy, isNode } from './util.js';

if (!isNode) {
	process.env = getProcessEnvProxy();
}

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);

	const onRequest = async (context: EventContext<unknown, any, unknown>) => {
		const request = context.request as Request & CFRequest
		const { next, env } = context

		process.env = env as any;

		const { pathname } = new URL(request.url);
		// static assets fallback, in case default _routes.json is not used
		if (manifest.assets.has(pathname)) {
			// we need this so the page does not error
			// https://developers.cloudflare.com/pages/platform/functions/advanced-mode/#set-up-a-function
			return (runtimeEnv.env as EventContext<unknown, string, unknown>['env']).ASSETS.fetch(
				request
			);
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
				...context,
				waitUntil: (promise: Promise<any>) => {
					context.waitUntil(promise);
				},
				name: 'cloudflare',
				next,
				caches,
				cf: request.cf,
			});

			let response = await app.render(request, routeData, { env });

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

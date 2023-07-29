import type { Request as CFRequest, EventContext } from '@cloudflare/workers-types';
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';
import { getProcessEnvProxy, isNode } from './util.js';

if (!isNode) {
	process.env = getProcessEnvProxy();
}

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);

	const onRequest = async (context: EventContext<unknown, string, unknown>) => {
		const request = context.request as CFRequest & Request
		const { next, env } = context

		process.env = env as any; // would love to remove this any cast in the future

		const { pathname } = new URL(request.url);
		// static assets fallback, in case default _routes.json is not used
		if (manifest.assets.has(pathname)) {
			return env.ASSETS.fetch(request)
		}

		let routeData = app.match(request, { matchNotFound: true });
		if (routeData) {
			Reflect.set(
				request,
				Symbol.for('astro.clientAddress'),
				request.headers.get('cf-connecting-ip')
			);

			// @deprecated: getRuntime() can be removed, use `Astro.locals.runtime` instead
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

			let response = await app.render(request, routeData, {
				env: env,
				cf: request.cf,
				runtime: {
					// request: Request; // not needed because we have Astro.request, thus they are minor differences
					// functionPath: string; // not needed
					waitUntil: (promise: Promise<any>) => { context.waitUntil(promise); },
					// passThroughOnException: () => void; // probably not needed ??
					// next: (input?: Request | string, init?: RequestInit) => Promise<Response>; // probably not needed ??
					env: context.env,
					params: context.params, // Isn't that the same as Astro.props ??
					// data: Data; // Should we include it ??: https://community.cloudflare.com/t/what-is-context-data-in-pages-functions/476559/7
					cf: request.cf,
					caches: caches,
				}
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

	return { onRequest, manifest };
}

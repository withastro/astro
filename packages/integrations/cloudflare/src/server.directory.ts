import type { Request as CFRequest, EventContext } from '@cloudflare/workers-types';
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';
import { getProcessEnvProxy, isNode } from './util.js';

if (!isNode) {
	process.env = getProcessEnvProxy();
}

interface FunctionRuntime {
	runtime: {
		waitUntil: (promise: Promise<any>) => void;
		env: EventContext<unknown, string, unknown>['env'];
		cf: CFRequest['cf'];
		caches: typeof caches;
	};
}

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);

	const onRequest = async (context: EventContext<unknown, string, unknown>) => {
		const request = context.request as CFRequest & Request;
		const { next, env } = context;

		// TODO: remove this any cast in the future
		// REF: the type cast to any is needed because the Cloudflare Env Type is not assignable to type 'ProcessEnv'
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

			// `getRuntime()` is deprecated, currently available additionally to new Astro.locals.runtime
			// TODO: remove `getRuntime()` in Astro 3.0
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

			const locals: FunctionRuntime = {
				runtime: {
					waitUntil: (promise: Promise<any>) => {
						context.waitUntil(promise);
					},
					env: context.env,
					cf: request.cf,
					caches: caches,
				},
			};

			let response = await app.render(request, routeData, locals);

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

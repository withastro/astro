import type { Request as CFRequest, EventContext } from '@cloudflare/workers-types';
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';
import { getProcessEnvProxy, isNode } from './util.js';

if (!isNode) {
	process.env = getProcessEnvProxy();
}

interface CloudflareContext {
	locals: {
		runtime: {
			waitUntil: (promise: Promise<any>) => void;
			env: Env;
			cf: CFRequest['cf'];
			caches: typeof caches;
		};
	};
}

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);

	const onRequest = async (context: EventContext<unknown, string, unknown>) => {
		const request = context.request as CFRequest & Request
		const { next, env } = context

		// TODO: remove this any cast in the future
		// REF: the type cast to any is needed because the Cloudflare Env Type is not assignable to type 'ProcessEnv'
		process.env = env as any;

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

			// @deprecated: getRuntime() can be removed in the next major release, after testing
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

			const cloudflareContext = {} as CloudflareContext;

			// We define a custom property, so we can check the value passed to locals
			Object.defineProperty(cloudflareContext, 'locals', {
				enumerable: true,
				// we should protect top-level locals from being overwritten
				// users should just use nested properties, e.g. locals.test = "foo"
				writable: false,
				configurable: false,
				value: {
					runtime: {
						waitUntil: (promise: Promise<any>) => { context.waitUntil(promise); },
						env: context.env,
						params: context.params, // These are params from Cloudflare, possible equal to Astro.params (unvalidated)
						cf: request.cf,
						caches: caches,
					},
				},
			});

			// We should freeze the runtime object, to make sure it&nested properties are not mutated
			Object.freeze(cloudflareContext.locals.runtime);
			
			let response = await app.render(request, routeData, cloudflareContext.locals);

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

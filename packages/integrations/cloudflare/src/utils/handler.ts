import type { App } from 'astro/app';
import type { SSRManifest } from 'astro';
import type {
	Request as CLOUDFLARE_REQUEST,
	CacheStorage as CLOUDFLARE_CACHESTORAGE,
} from '@cloudflare/workers-types';

type Env = {
	[key: string]: unknown;
	ASSETS: { fetch: (req: Request | string) => Promise<Response> };
	ASTRO_STUDIO_APP_TOKEN?: string;
};

export interface Runtime<T extends object = object> {
	runtime: {
		env: Env & T;
		cf: CLOUDFLARE_REQUEST['cf'];
		caches: CLOUDFLARE_CACHESTORAGE;
		ctx: ExecutionContext;
	};
}

export async function handle(
	manifest: SSRManifest,
	app: App,
	request: Request & CLOUDFLARE_REQUEST,
	env: Env,
	context: ExecutionContext,
) {
	const { pathname } = new URL(request.url);
	const bindingName = globalThis.__ASTRO_SESSION_BINDING_NAME;
	// Assigning the KV binding to globalThis allows unstorage to access it for session storage.
	// unstorage checks in globalThis and globalThis.__env__ for the binding.
	globalThis.__env__ ??= {};
	globalThis.__env__[bindingName] = env[bindingName];

	// static assets fallback, in case default _routes.json is not used
	if (manifest.assets.has(pathname)) {
		return env.ASSETS.fetch(request.url.replace(/\.html$/, ''));
	}

	const routeData = app.match(request);
	if (!routeData) {
		// https://developers.cloudflare.com/pages/functions/api-reference/#envassetsfetch
		const asset = await env.ASSETS.fetch(
			request.url.replace(/index.html$/, '').replace(/\.html$/, ''),
		);
		if (asset.status !== 404) {
			return asset;
		}
	}

	Reflect.set(request, Symbol.for('astro.clientAddress'), request.headers.get('cf-connecting-ip'));

	process.env.ASTRO_STUDIO_APP_TOKEN ??= (() => {
		if (typeof env.ASTRO_STUDIO_APP_TOKEN === 'string') {
			return env.ASTRO_STUDIO_APP_TOKEN;
		}
	})();

	const locals: Runtime = {
		runtime: {
			env: env,
			cf: request.cf,
			caches: caches as unknown as CLOUDFLARE_CACHESTORAGE,
			ctx: {
				waitUntil: (promise: Promise<any>) => context.waitUntil(promise),
				// Currently not available: https://developers.cloudflare.com/pages/platform/known-issues/#pages-functions
				passThroughOnException: () => {
					throw new Error(
						'`passThroughOnException` is currently not available in Cloudflare Pages. See https://developers.cloudflare.com/pages/platform/known-issues/#pages-functions.',
					);
				},
				props: {},
			},
		},
	};

	const response = await app.render(request, { routeData, locals });

	if (app.setCookieHeaders) {
		for (const setCookieHeader of app.setCookieHeaders(response)) {
			response.headers.append('Set-Cookie', setCookieHeader);
		}
	}

	return response;
}

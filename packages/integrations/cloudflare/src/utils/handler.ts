// @ts-expect-error - It is safe to expect the error here.
import { env as globalEnv } from 'cloudflare:workers';
import type {
	CacheStorage as CloudflareCacheStorage,
	ExecutionContext,
	ExportedHandlerFetchHandler,
} from '@cloudflare/workers-types';
import type { SSRManifest } from 'astro';
import type { App } from 'astro/app';
import { setGetEnv } from 'astro/env/setup';
import { createGetEnv } from '../utils/env.js';

type Env = {
	[key: string]: unknown;
	ASSETS: { fetch: (req: Request | string) => Promise<Response> };
};

setGetEnv(createGetEnv(globalEnv as Env));

export interface Runtime<T extends object = object> {
	runtime: {
		env: Env & T;
		cf: Parameters<ExportedHandlerFetchHandler>[0]['cf'];
		caches: CloudflareCacheStorage;
		ctx: ExecutionContext;
	};
}

declare global {
	// This is not a real global, but is injected using Vite define to allow us to specify the session binding name in the config.
	var __ASTRO_SESSION_BINDING_NAME: string;

	// Just used to pass the KV binding to unstorage.
	var __env__: Partial<Env>;
}

export async function handle(
	manifest: SSRManifest,
	app: App,
	request: Parameters<ExportedHandlerFetchHandler>[0],
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

	const routeData = app.match(request as Request & Parameters<ExportedHandlerFetchHandler>[0]);
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

	const locals: Runtime = {
		runtime: {
			env: env,
			cf: request.cf,
			caches: caches as unknown as CloudflareCacheStorage,
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

	const response = await app.render(
		request as Request & Parameters<ExportedHandlerFetchHandler>[0],
		{
			routeData,
			locals,
			prerenderedErrorPageFetch: async (url) => {
				return env.ASSETS.fetch(url.replace(/\.html$/, ''));
			},
		},
	);

	if (app.setCookieHeaders) {
		for (const setCookieHeader of app.setCookieHeaders(response)) {
			response.headers.append('Set-Cookie', setCookieHeader);
		}
	}

	return response;
}

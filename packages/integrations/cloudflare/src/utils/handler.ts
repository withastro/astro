import { env as globalEnv } from 'cloudflare:workers';
import { sessionKVBindingName } from 'virtual:astro-cloudflare:config';
import type {
	Response as CfResponse,
	ExecutionContext,
	ExportedHandlerFetchHandler,
} from '@cloudflare/workers-types';
import { createApp } from 'astro/app/entrypoint';
import { setGetEnv } from 'astro/env/setup';
import { createGetEnv } from '../utils/env.js';

export type Env = {
	[key: string]: unknown;
	ASSETS: { fetch: (req: Request | string) => Promise<CfResponse> };
};

setGetEnv(createGetEnv(globalEnv as Env));

export interface Runtime {
	cfContext: ExecutionContext;
}

declare global {
	// This is not a real global, but is injected using Vite define to allow us to specify the Images binding name in the config.
	var __ASTRO_IMAGES_BINDING_NAME: string;
}

export async function handle(
	request: Parameters<ExportedHandlerFetchHandler>[0],
	env: Env,
	context: ExecutionContext,
): Promise<CfResponse> {
	const app = createApp(import.meta.env.DEV);
	const { pathname } = new URL(request.url);

	if (env[sessionKVBindingName]) {
		const sessionConfigOptions = app.manifest.sessionConfig?.options ?? {};
		Object.assign(sessionConfigOptions, {
			binding: env[sessionKVBindingName],
		});
	}

	// static assets fallback, in case default _routes.json is not used
	if (app.manifest.assets.has(pathname)) {
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

	const locals: Runtime = {
		cfContext: context,
	};
	Object.defineProperty(locals, 'runtime', {
		enumerable: false,
		value: {
			get env(): never {
				throw new Error(
					`Astro.locals.runtime.env has been removed in Astro v6. Use 'import { env } from "cloudflare:workers"' instead.`,
				);
			},
			get cf(): never {
				throw new Error(
					`Astro.locals.runtime.cf has been removed in Astro v6. Use 'Astro.request.cf' instead.`,
				);
			},
			get caches(): never {
				throw new Error(
					`Astro.locals.runtime.caches has been removed in Astro v6. Use the global 'caches' object instead.`,
				);
			},
			get ctx(): never {
				throw new Error(
					`Astro.locals.runtime.ctx has been removed in Astro v6. Use 'Astro.locals.cfContext' instead.`,
				);
			},
		},
	});

	const response = await app.render(
		request as Request & Parameters<ExportedHandlerFetchHandler>[0],
		{
			routeData,
			locals,
			prerenderedErrorPageFetch: async (url) => {
				return env.ASSETS.fetch(url.replace(/\.html$/, '')) as unknown as Response;
			},
			clientAddress: request.headers.get('cf-connecting-ip') ?? undefined,
		},
	);

	if (app.setCookieHeaders) {
		for (const setCookieHeader of app.setCookieHeaders(response)) {
			response.headers.append('Set-Cookie', setCookieHeader);
		}
	}

	return response as unknown as CfResponse;
}

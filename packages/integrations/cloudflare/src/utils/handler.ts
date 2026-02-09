import { env as globalEnv } from 'cloudflare:workers';
import { sessionKVBindingName, isPrerender } from 'virtual:astro-cloudflare:config';
import { createApp } from 'astro/app/entrypoint';
import { setGetEnv } from 'astro/env/setup';
import { createGetEnv } from '../utils/env.js';
import type { RouteData } from 'astro';
import {
	isStaticPathsRequest,
	isPrerenderRequest,
	handleStaticPathsRequest,
	handlePrerenderRequest,
} from './prerender.js';

setGetEnv(createGetEnv(globalEnv));

export interface Runtime {
	cfContext: ExecutionContext;
}

declare global {
	// This is not a real global, but is injected using Vite define to allow us to specify the Images binding name in the config.
	var __ASTRO_IMAGES_BINDING_NAME: string;
}

type CfResponse = Awaited<ReturnType<Required<ExportedHandler<Env>>['fetch']>>;

const app = createApp();

export async function handle(
	request: Request,
	env: Env,
	context: ExecutionContext,
): Promise<CfResponse> {
	// Handle prerender endpoints (only active during build prerender phase)
	if (isPrerender) {
		if (isStaticPathsRequest(request)) {
			return handleStaticPathsRequest(app) as unknown as CfResponse;
		}
		if (isPrerenderRequest(request)) {
			return handlePrerenderRequest(app, request) as unknown as CfResponse;
		}
	}

	const { pathname: requestPathname } = new URL(request.url);

	if (env[sessionKVBindingName]) {
		const sessionConfigOptions = app.manifest.sessionConfig?.options ?? {};
		Object.assign(sessionConfigOptions, {
			binding: env[sessionKVBindingName],
		});
	}

	// static assets fallback, in case default _routes.json is not used
	if (app.manifest.assets.has(requestPathname)) {
		return env.ASSETS.fetch(request.url.replace(/\.html$/, ''));
	}

	let routeData: RouteData | undefined = undefined;
	if (app.isDev()) {
		const result = await app.devMatch(app.getPathnameFromRequest(request));
		if (result) {
			routeData = result.routeData;
		}
	} else {
		routeData = app.match(request);
	}

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

	const response = await app.render(request, {
		routeData,
		locals,
		prerenderedErrorPageFetch: async (url: string) => {
			return env.ASSETS.fetch(url.replace(/\.html$/, ''));
		},
		clientAddress: request.headers.get('cf-connecting-ip') ?? undefined,
	});

	if (app.setCookieHeaders) {
		for (const setCookieHeader of app.setCookieHeaders(response)) {
			response.headers.append('Set-Cookie', setCookieHeader);
		}
	}

	return response;
}

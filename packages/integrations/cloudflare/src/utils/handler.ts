import { env as globalEnv } from 'cloudflare:workers';
import { compileImageConfig, isPrerender } from 'virtual:astro-cloudflare:config';
import type { RenderOptions } from 'astro/app';
import { createApp } from 'astro/app/entrypoint';
import { setGetEnv } from 'astro/env/setup';
import { createGetEnv } from '../utils/env.js';
import type { RouteData } from 'astro';
import {
	isStaticPathsRequest,
	isPrerenderRequest,
	handleStaticPathsRequest,
	handlePrerenderRequest,
	isStaticImagesRequest,
	handleStaticImagesRequest,
} from './prerender.js';
import {
	type Runtime,
	injectSessionBinding,
	matchStaticAsset,
	fallbackToAssets,
	createErrorPageFetch,
	createLocals,
	getClientAddress,
} from './cf.js';

export type { Runtime };

setGetEnv(createGetEnv(globalEnv));

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
		if (compileImageConfig) {
			const { installAddStaticImage } = await import('./static-image-collection.js');
			installAddStaticImage(compileImageConfig);
		}

		if (isStaticPathsRequest(request)) {
			return handleStaticPathsRequest(app) as unknown as CfResponse;
		}
		if (isPrerenderRequest(request)) {
			return handlePrerenderRequest(app, request) as unknown as CfResponse;
		}
		if (isStaticImagesRequest(request)) {
			return handleStaticImagesRequest() as unknown as CfResponse;
		}
	}

	injectSessionBinding(app.manifest, env);

	// NOTE this ASSETS binding path is needed for users who are using `run_worker_first` routing
	const staticAsset = matchStaticAsset(app.manifest, request.url, env);
	if (staticAsset) return staticAsset as CfResponse;

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
		// NOTE this ASSETS binding path is needed for users who are using `run_worker_first` routing
		const asset = await fallbackToAssets(request.url, env);
		if (asset) return asset as CfResponse;
	}

	const locals = createLocals(context);
	const waitUntil: RenderOptions['waitUntil'] = context.waitUntil.bind(context);

	const response = await app.render(request, {
		routeData,
		locals,
		waitUntil,
		prerenderedErrorPageFetch: createErrorPageFetch(env),
		clientAddress: getClientAddress(request),
	});

	if (app.setCookieHeaders) {
		for (const setCookieHeader of app.setCookieHeaders(response)) {
			response.headers.append('Set-Cookie', setCookieHeader);
		}
	}

	return response;
}

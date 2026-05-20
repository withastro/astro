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
// Use a non-streaming app for prerender requests so rendering errors propagate
// synchronously via renderToString() instead of being deferred via
// setTimeout(() => controller.error(e), 0) in renderToReadableStream().
// This ensures errors result in a 500 response rather than a truncated 200.
const prerenderApp = isPrerender ? createApp({ streaming: false }) : undefined;

const encoder = new TextEncoder();

/**
 * Wraps a response body stream to catch rendering errors mid-stream and inject
 * an error overlay script. In dev mode, renderToReadableStream() defers errors
 * via setTimeout, so they fire after the 200 response has already started.
 * This wrapper intercepts those errors and appends a script that triggers
 * Astro's error overlay in the browser.
 */
function wrapStreamWithErrorHandling(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
	const reader = body.getReader();
	return new ReadableStream({
		async pull(controller) {
			try {
				const { done, value } = await reader.read();
				if (done) {
					controller.close();
				} else {
					controller.enqueue(value);
				}
			} catch (err: unknown) {
				const error = err instanceof Error ? err : new Error(String(err));
				const errorPayload = JSON.stringify({
					message: error.message,
					stack: error.stack,
				});
				const script = `<script type="module" src="/@vite/client"></script>
<script type="module">
const err = ${errorPayload};
const ErrorOverlay = customElements.get('vite-error-overlay');
if (ErrorOverlay) {
	document.body.appendChild(new ErrorOverlay(err));
}
</script>`;
				controller.enqueue(encoder.encode(script));
				controller.close();
			}
		},
		cancel() {
			reader.cancel().catch(() => {});
		},
	});
}

export async function handle(
	request: Request,
	env: Env,
	context: ExecutionContext,
): Promise<CfResponse> {
	// Handle prerender endpoints (only active during build prerender phase)
	if (isPrerender && prerenderApp) {
		if (compileImageConfig) {
			const { installAddStaticImage } = await import('./static-image-collection.js');
			installAddStaticImage(compileImageConfig);
		}

		if (isStaticPathsRequest(request)) {
			return handleStaticPathsRequest(prerenderApp) as unknown as CfResponse;
		}
		if (isPrerenderRequest(request)) {
			return handlePrerenderRequest(prerenderApp, request) as unknown as CfResponse;
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

	// In dev mode, wrap the response body stream to catch rendering errors mid-stream
	// and inject Astro's error overlay. Without this, errors in renderToReadableStream()
	// silently truncate the page because the 200 response has already started.
	if (app.isDev() && response.body) {
		const wrappedBody = wrapStreamWithErrorHandling(response.body);
		return new Response(wrappedBody, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});
	}

	return response;
}

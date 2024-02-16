import type http from 'node:http';
import { collapseDuplicateSlashes, removeTrailingForwardSlash } from '../core/path.js';
import { isServerLikeOutput } from '../prerender/utils.js';
import type { DevServerController } from './controller.js';
import { runWithErrorHandling } from './controller.js';
import type { DevPipeline } from './pipeline.js';
import { handle500Response } from './response.js';
import { handleRoute, matchRoute } from './route.js';
import { recordServerError } from './error.js';

type HandleRequest = {
	pipeline: DevPipeline;
	controller: DevServerController;
	incomingRequest: http.IncomingMessage;
	incomingResponse: http.ServerResponse;
};

/** The main logic to route dev server requests to pages in Astro. */
export async function handleRequest({
	pipeline,
	controller,
	incomingRequest,
	incomingResponse,
}: HandleRequest) {
	const { config, loader } = pipeline;
	const origin = `${loader.isHttps() ? 'https' : 'http'}://${incomingRequest.headers.host}`;
	const buildingToSSR = isServerLikeOutput(config);

	const url = new URL(collapseDuplicateSlashes(origin + incomingRequest.url));
	let pathname: string;
	if (config.trailingSlash === 'never' && !incomingRequest.url) {
		pathname = '';
	} else {
		pathname = url.pathname;
	}

	// Add config.base back to url before passing it to SSR
	url.pathname = removeTrailingForwardSlash(config.base) + url.pathname;

	// HACK! astro:assets uses query params for the injected route in `dev`
	if (!buildingToSSR && pathname !== '/_image') {
		// Prevent user from depending on search params when not doing SSR.
		// NOTE: Create an array copy here because deleting-while-iterating
		// creates bugs where not all search params are removed.
		const allSearchParams = Array.from(url.searchParams);
		for (const [key] of allSearchParams) {
			url.searchParams.delete(key);
		}
	}

	let body: ArrayBuffer | undefined = undefined;
	if (!(incomingRequest.method === 'GET' || incomingRequest.method === 'HEAD')) {
		let bytes: Uint8Array[] = [];
		await new Promise((resolve) => {
			incomingRequest.on('data', (part) => {
				bytes.push(part);
			});
			incomingRequest.on('end', resolve);
		});
		body = Buffer.concat(bytes);
	}

	await runWithErrorHandling({
		controller,
		pathname,
		async run() {
			const matchedRoute = await matchRoute(pathname, pipeline);
			const resolvedPathname = matchedRoute?.resolvedPathname ?? pathname;
			return await handleRoute({
				matchedRoute,
				url,
				pathname: resolvedPathname,
				body,
				origin,
				pipeline,
				incomingRequest,
				incomingResponse,
			});
		},
		onError(_err) {
			const { error, errorWithMetadata } = recordServerError(loader, config, pipeline, _err);
			handle500Response(loader, incomingResponse, errorWithMetadata);
			return error;
		},
	});
}

import type http from 'node:http';
import type { ManifestData, SSRManifest } from '../@types/astro';
import type { DevServerController } from './controller';
import { collectErrorMetadata } from '../core/errors/dev/index.js';
import { createSafeError } from '../core/errors/index.js';
import * as msg from '../core/messages.js';
import { collapseDuplicateSlashes, removeTrailingForwardSlash } from '../core/path.js';
import { eventError, telemetry } from '../events/index.js';
import { isServerLikeOutput } from '../prerender/utils.js';
import { runWithErrorHandling } from './controller.js';
import { handle500Response } from './response.js';
import { handleRoute, matchRoute } from './route.js';
import type DevPipeline from './devPipeline';

type HandleRequest = {
	pipeline: DevPipeline;
	manifestData: ManifestData;
	controller: DevServerController;
	incomingRequest: http.IncomingMessage;
	incomingResponse: http.ServerResponse;
	manifest: SSRManifest;
};

/** The main logic to route dev server requests to pages in Astro. */
export async function handleRequest({
	pipeline,
	manifestData,
	controller,
	incomingRequest,
	incomingResponse,
	manifest,
}: HandleRequest) {
	const config = pipeline.getConfig();
	const moduleLoader = pipeline.getModuleLoader();
	const origin = `${moduleLoader.isHttps() ? 'https' : 'http'}://${incomingRequest.headers.host}`;
	const buildingToSSR = isServerLikeOutput(config);

	const url = new URL(collapseDuplicateSlashes(origin + incomingRequest.url));
	let pathname: string;
	if (config.trailingSlash === 'never' && !incomingRequest.url) {
		pathname = '';
	} else {
		pathname = decodeURI(url.pathname);
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
			const matchedRoute = await matchRoute(pathname, manifestData, pipeline);
			const resolvedPathname = matchedRoute?.resolvedPathname ?? pathname;
			return await handleRoute({
				matchedRoute,
				url,
				pathname: resolvedPathname,
				body,
				origin,
				pipeline,
				manifestData,
				incomingRequest: incomingRequest,
				incomingResponse: incomingResponse,
				manifest,
			});
		},
		onError(_err) {
			const err = createSafeError(_err);

			// This could be a runtime error from Vite's SSR module, so try to fix it here
			try {
				moduleLoader.fixStacktrace(err);
			} catch {}

			// This is our last line of defense regarding errors where we still might have some information about the request
			// Our error should already be complete, but let's try to add a bit more through some guesswork
			const errorWithMetadata = collectErrorMetadata(err, config.root);

			telemetry.record(eventError({ cmd: 'dev', err: errorWithMetadata, isFatal: false }));

			pipeline.logger.error(null, msg.formatErrorMessage(errorWithMetadata));
			handle500Response(moduleLoader, incomingResponse, errorWithMetadata);

			return err;
		},
	});
}

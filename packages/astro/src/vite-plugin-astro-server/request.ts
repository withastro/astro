import type http from 'node:http';
import { hasFileExtension } from '@astrojs/internal-helpers/path';
import { appendForwardSlash, removeTrailingForwardSlash } from '../core/path.js';
import { validateAndDecodePathname } from '../core/util/pathname.js';
import type { RoutesList } from '../types/astro.js';
import type { DevServerController } from './controller.js';
import { runWithErrorHandling } from './controller.js';
import { recordServerError } from './error.js';
import type { DevPipeline } from './pipeline.js';
import { handle500Response } from './response.js';
import { handleRoute, matchRoute } from './route.js';

type HandleRequest = {
	pipeline: DevPipeline;
	routesList: RoutesList;
	controller: DevServerController;
	incomingRequest: http.IncomingMessage;
	incomingResponse: http.ServerResponse;
};

/** The main logic to route dev server requests to pages in Astro. */
export async function handleRequest({
	pipeline,
	routesList,
	controller,
	incomingRequest,
	incomingResponse,
}: HandleRequest) {
	const { config, loader } = pipeline;
	const origin = `${loader.isHttps() ? 'https' : 'http'}://${
		incomingRequest.headers[':authority'] ?? incomingRequest.headers.host
	}`;

	const url = new URL(origin + incomingRequest.url);
	let pathname: string;
	if (config.trailingSlash === 'never' && !incomingRequest.url) {
		pathname = '';
	} else {
		try {
			// Decode and validate pathname to prevent multi-level encoding bypass attacks
			pathname = validateAndDecodePathname(url.pathname);
		} catch {
			// Multi-level encoding detected or invalid encoding - return 404
			incomingResponse.writeHead(404, { 'Content-Type': 'text/plain' });
			incomingResponse.end('Not Found');
			return;
		}
	}

	// Add config.base back to url before passing it to SSR
	url.pathname = removeTrailingForwardSlash(config.base) + pathname;

	// Apply trailing slash configuration consistently
	if (config.trailingSlash === 'never') {
		url.pathname = removeTrailingForwardSlash(url.pathname);
	} else if (config.trailingSlash === 'always' && !hasFileExtension(url.pathname)) {
		url.pathname = appendForwardSlash(url.pathname);
	}

	let body: BodyInit | undefined = undefined;
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
			const matchedRoute = await matchRoute(pathname, routesList, pipeline);
			const resolvedPathname = matchedRoute?.resolvedPathname ?? pathname;
			return await handleRoute({
				matchedRoute,
				url,
				pathname: resolvedPathname,
				body,
				pipeline,
				routesList,
				incomingRequest: incomingRequest,
				incomingResponse: incomingResponse,
			});
		},
		onError(_err) {
			const { error, errorWithMetadata } = recordServerError(loader, config, pipeline, _err);
			handle500Response(loader, incomingResponse, errorWithMetadata);
			return error;
		},
	});
}

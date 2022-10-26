import type http from 'http';
import type { ManifestData, RouteData } from '../@types/astro';
import type { DevServerController } from './controller';
import type { DevelopmentEnvironment } from '../core/render/dev/index';

import { collectErrorMetadata } from '../core/errors/dev/index.js';
import { error } from '../core/logger/core.js';
import * as msg from '../core/messages.js';
import { handleRoute, matchRoute } from './route.js';
import { handle500Response } from './response.js';
import { runWithErrorHandling } from './controller.js';
import { createSafeError } from '../core/errors/index.js';

/** The main logic to route dev server requests to pages in Astro. */
export async function handleRequest(
	env: DevelopmentEnvironment,
	manifest: ManifestData,
	controller: DevServerController,
	req: http.IncomingMessage,
	res: http.ServerResponse
) {
	const { settings, loader: moduleLoader } = env;
	const { config } = settings;
	const origin = `${moduleLoader.isHttps() ? 'https' : 'http'}://${req.headers.host}`;
	const buildingToSSR = config.output === 'server';
	// Ignore `.html` extensions and `index.html` in request URLS to ensure that
	// routing behavior matches production builds. This supports both file and directory
	// build formats, and is necessary based on how the manifest tracks build targets.
	const url = new URL(origin + req.url?.replace(/(index)?\.html$/, ''));
	const pathname = decodeURI(url.pathname);

	// Add config.base back to url before passing it to SSR
	url.pathname = config.base.substring(0, config.base.length - 1) + url.pathname;

	// HACK! @astrojs/image uses query params for the injected route in `dev`
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
	if (!(req.method === 'GET' || req.method === 'HEAD')) {
		let bytes: Uint8Array[] = [];
		await new Promise((resolve) => {
			req.on('data', (part) => {
				bytes.push(part);
			});
			req.on('end', resolve);
		});
		body = Buffer.concat(bytes);
	}

	await runWithErrorHandling({
		controller,
		pathname,
		async run() {
			const matchedRoute = await matchRoute(pathname, env, manifest);
	
			return await handleRoute(matchedRoute, url, pathname, body, origin, env, manifest, req, res);
		},
		onError(_err) {
			const err = createSafeError(_err);
			// This is our last line of defense regarding errors where we still might have some information about the request
			// Our error should already be complete, but let's try to add a bit more through some guesswork
			const errorWithMetadata = collectErrorMetadata(err);

			error(env.logging, null, msg.formatErrorMessage(errorWithMetadata));
			handle500Response(moduleLoader, res, errorWithMetadata);

			return err;
		}
	});
}

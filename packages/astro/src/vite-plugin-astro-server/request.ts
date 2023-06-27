import type http from 'http';
import type { ManifestData } from '../@types/astro';
import type { DevelopmentEnvironment } from '../core/render/dev/index';
import type { DevServerController } from './controller';

import { collectErrorMetadata } from '../core/errors/dev/index.js';
import { createSafeError } from '../core/errors/index.js';
import { error } from '../core/logger/core.js';
import * as msg from '../core/messages.js';
import { removeTrailingForwardSlash } from '../core/path.js';
import { eventError, telemetry } from '../events/index.js';
import { isServerLikeOutput } from '../prerender/utils.js';
import { runWithErrorHandling } from './controller.js';
import { handle500Response } from './response.js';
import { handleRoute, matchRoute } from './route.js';

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
	const buildingToSSR = isServerLikeOutput(config);

	const url = new URL(origin + req.url);
	let pathname: string;
	if (config.trailingSlash === 'never' && !req.url) {
		pathname = '';
	} else {
		pathname = decodeURI(url.pathname);
	}

	// Add config.base back to url before passing it to SSR
	url.pathname = removeTrailingForwardSlash(config.base) + url.pathname;

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
			const resolvedPathname = matchedRoute?.resolvedPathname ?? pathname;
			return await handleRoute(
				matchedRoute,
				url,
				resolvedPathname,
				body,
				origin,
				env,
				manifest,
				req,
				res
			);
		},
		onError(_err) {
			const err = createSafeError(_err);

			// This could be a runtime error from Vite's SSR module, so try to fix it here
			try {
				env.loader.fixStacktrace(err as Error);
			} catch {}

			// This is our last line of defense regarding errors where we still might have some information about the request
			// Our error should already be complete, but let's try to add a bit more through some guesswork
			const errorWithMetadata = collectErrorMetadata(err, config.root);

			if (env.telemetry !== false) {
				telemetry.record(eventError({ cmd: 'dev', err: errorWithMetadata, isFatal: false }));
			}

			error(env.logging, null, msg.formatErrorMessage(errorWithMetadata));
			handle500Response(moduleLoader, res, errorWithMetadata);

			return err;
		},
	});
}

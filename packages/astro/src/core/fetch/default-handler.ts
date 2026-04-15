import type { SSRManifest } from '../../types/public/index.js';
import type { Pipeline } from '../base-pipeline.js';
import type { AstroLogger } from '../logger/core.js';
import type { FetchHandler } from './types.js';
import { FetchState } from '../app/fetch-state.js';
import { createAstroHandler, type AstroHandlerOptions } from '../routing/handler.js';

export interface DefaultFetchHandlerDeps {
	pipeline: Pipeline;
	manifest: SSRManifest;
	logger: AstroLogger;
}

/**
 * Creates a plain `{ fetch }` object that handles Astro requests without
 * depending on Hono. This is the default internal handler used when the user
 * does not provide a custom `src/app.ts`.
 *
 * The returned object satisfies the `FetchHandler` interface, so it can be
 * used interchangeably with Hono apps or any other fetch-compatible handler.
 */
export function createDefaultFetchHandler(
	deps: DefaultFetchHandlerDeps,
	options: AstroHandlerOptions = {},
): FetchHandler {
	const { pipeline } = deps;
	const handle = createAstroHandler(deps, options);

	return {
		async fetch(request: Request): Promise<Response> {
			const state = new FetchState(request, pipeline);
			return handle(state);
		},
	};
}

import type { BaseApp } from '../app/base.js';
import { FetchState } from '../app/fetch-state.js';
import { AstroHandler } from '../routing/handler.js';
import type { FetchHandler } from './types.js';

/**
 * The default request handler used by `BaseApp`. It builds the per-request
 * `FetchState` and delegates to an `AstroHandler`. This is an intermediate
 * layer that exists so future work can add additional handlers
 * (user-provided Hono apps, middleware composition, etc.) without changing
 * `BaseApp` itself.
 *
 * Resolved render options are passed from `BaseApp#render()` through the
 * request via the render-options symbol and read by `FetchState`.
 */
export class DefaultFetchHandler {
	#app: BaseApp<any>;
	#astroHandler: AstroHandler;

	constructor(app: BaseApp<any>) {
		this.#app = app;
		this.#astroHandler = new AstroHandler(app);
	}

	fetch: FetchHandler = (request) => {
		const state = new FetchState(this.#app.pipeline, request);
		return this.#astroHandler.handle(state);
	};
}

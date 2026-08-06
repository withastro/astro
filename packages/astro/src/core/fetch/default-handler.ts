import type { BaseApp, ResolvedRenderOptions } from '../app/base.js';
import type { Pipeline } from '../base-pipeline.js';
import { FetchState } from './fetch-state.js';
import { appSymbol } from '../constants.js';
import { AstroHandler } from '../routing/handler.js';
import type { FetchHandler } from './types.js';

/**
 * The default request handler for `BaseApp`. Builds the per-request
 * `FetchState` and delegates to an `AstroHandler`.
 */
export class DefaultFetchHandler {
	#app: BaseApp<Pipeline> | null;
	#handler: AstroHandler | null;

	constructor(app?: BaseApp<Pipeline>) {
		this.#app = app ?? null;
		this.#handler = app ? new AstroHandler(app) : null;
	}

	/**
	 * Fast path: called directly by `BaseApp.render()` with pre-resolved
	 * options, avoiding the `Reflect.set/get` round-trip through the request.
	 */
	renderWithOptions(request: Request, options: ResolvedRenderOptions): Promise<Response> {
		if (!this.#app) {
			const app = Reflect.get(request, appSymbol) as BaseApp<Pipeline> | undefined;
			if (!app) {
				throw new Error('No fetch handler provided.');
			}
			this.#app = app;
			this.#handler = new AstroHandler(app);
		}
		const state = new FetchState(this.#app.pipeline, request, options);
		return this.#handler!.handle(state);
	}

	fetch: FetchHandler = (request) => {
		if (!this.#app) {
			const app = Reflect.get(request, appSymbol) as BaseApp<Pipeline> | undefined;
			if (!app) {
				throw new Error('No fetch handler provided.');
			}
			this.#app = app;
			this.#handler = new AstroHandler(app);
		}
		const state = new FetchState(this.#app.pipeline, request);
		if (!this.#handler) {
			throw new Error('No fetch handler provided.');
		}
		return this.#handler.handle(state);
	};
}

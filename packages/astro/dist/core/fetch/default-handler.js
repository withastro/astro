import { FetchState } from './fetch-state.js';
import { appSymbol } from '../constants.js';
import { AstroHandler } from '../routing/handler.js';
class DefaultFetchHandler {
	#app;
	#handler;
	constructor(app) {
		this.#app = app ?? null;
		this.#handler = app ? new AstroHandler(app) : null;
	}
	/**
	 * Fast path: called directly by `BaseApp.render()` with pre-resolved
	 * options, avoiding the `Reflect.set/get` round-trip through the request.
	 */
	renderWithOptions(request, options) {
		if (!this.#app) {
			const app = Reflect.get(request, appSymbol);
			if (!app) {
				throw new Error('No fetch handler provided.');
			}
			this.#app = app;
			this.#handler = new AstroHandler(app);
		}
		const state = new FetchState(this.#app.pipeline, request, options);
		return this.#handler.handle(state);
	}
	fetch = (request) => {
		if (!this.#app) {
			const app = Reflect.get(request, appSymbol);
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
export { DefaultFetchHandler };

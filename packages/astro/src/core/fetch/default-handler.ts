import type { BaseApp } from '../app/base.js';
import { FetchState } from './fetch-state.js';
import { appSymbol } from '../constants.js';
import { AstroHandler } from '../routing/handler.js';
import type { FetchHandler } from './types.js';

/**
 * The default request handler for `BaseApp`. Builds the per-request
 * `FetchState` and delegates to an `AstroHandler`.
 */
export class DefaultFetchHandler {
	#app: BaseApp<any> | null;
	#handler: AstroHandler | null;

	constructor(app?: BaseApp<any>) {
		this.#app = app ?? null;
		this.#handler = app ? new AstroHandler(app) : null;
	}

	fetch: FetchHandler = (request) => {
		if(!this.#app) {
			const app = (Reflect.get(request, appSymbol) as BaseApp<any> | undefined);
			if (!app) {
				throw new Error(
					'DefaultFetchHandler.fetch() called on a request without an attached app. ' +
						'Ensure BaseApp.render stamped the request with appSymbol, or pass an app to the constructor.',
				);
			}
			this.#app = app;
			this.#handler = new AstroHandler(app);
		}
		const state = new FetchState(this.#app.pipeline, request);
		return this.#handler!.handle(state);
	};
}

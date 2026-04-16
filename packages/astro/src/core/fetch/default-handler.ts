import type { BaseApp } from '../app/base.js';
import { AstroHandler } from '../routing/handler.js';
import type { FetchHandler } from './types.js';

/**
 * The default request handler used by `BaseApp`. It owns an `AstroHandler`
 * and simply forwards requests to it. This is an intermediate layer that
 * exists so future work can add additional handlers (user-provided Hono
 * apps, middleware composition, etc.) without changing `BaseApp` itself.
 *
 * Resolved render options are passed from `BaseApp#render()` through the
 * request via the render-options symbol; this handler does not need to
 * know about them.
 */
export class DefaultFetchHandler {
	#astroHandler: AstroHandler;

	constructor(app: BaseApp<any>) {
		this.#astroHandler = new AstroHandler(app);
	}

	fetch: FetchHandler = (request) => {
		return this.#astroHandler.handle(request);
	};
}

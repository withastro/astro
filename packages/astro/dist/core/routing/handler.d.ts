import type { FetchState } from '../fetch/fetch-state.js';
import type { BaseApp } from '../app/base.js';
import { type Pipeline } from '../base-pipeline.js';
export declare class AstroHandler {
	#private;
	constructor(app: BaseApp<Pipeline>);
	handle(state: FetchState): Promise<Response>;
	/**
	 * Renders a response for the given `FetchState`. Assumes
	 * trailing-slash redirects and routeData resolution have already run.
	 *
	 * User-triggered rewrites (`Astro.rewrite` / `ctx.rewrite`) go through
	 * `Rewrites.execute` on the current `FetchState` — they mutate the
	 * existing state in place and re-run middleware + page dispatch.
	 */
	render(state: FetchState): Promise<Response>;
}

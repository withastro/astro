import type { ResolvedRenderOptions } from '../app/base.js';
import type { SSRManifest } from '../app/types.js';
import { getAmbientManifest } from '../manifest/ambient.js';
import { getRenderOptions } from '../app/render-options.js';
import { handleRequest } from '../routing/handler.js';
import { FetchState } from './fetch-state.js';
import type { FetchHandler } from './types.js';

/**
 * The default request handler for `BaseApp`. Stateless: builds the
 * per-request `FetchState` from the manifest and delegates to
 * `handleRequest`.
 *
 * The export path (`astro/app/fetch/default-handler`), the class name, and
 * no-arg constructibility are baked into generated builds
 * (`core/fetch/vite-plugin.ts` emits `new DefaultFetchHandler()`), so all
 * three survive.
 */
export class DefaultFetchHandler {
	#manifest: SSRManifest | undefined;

	/**
	 * The optional parameter is KEPT for back-compat (callers historically
	 * passed a `BaseApp`), structurally widened to `{ manifest: SSRManifest }`
	 * — assignable from every current caller. Only the manifest is retained;
	 * it is a resolution fallback ahead of the ambient manifest.
	 */
	constructor(app?: { manifest: SSRManifest }) {
		this.#manifest = app?.manifest;
	}

	/**
	 * Fast path historically called by `BaseApp.render()` with pre-resolved
	 * options. Kept as a compat shim — `BaseApp.render` now constructs the
	 * `FetchState` itself (so it can pass the internal facade hooks) and
	 * calls `handleRequest` directly.
	 */
	renderWithOptions(request: Request, options: ResolvedRenderOptions): Promise<Response> {
		const manifest = this.#manifest ?? getAmbientManifest();
		return handleRequest(new FetchState(manifest, request, options));
	}

	fetch: FetchHandler = (request) => {
		const options = getRenderOptions(request);
		// Ambient-only manifest resolution: the render-options record
		// carries only genuine `render()` inputs — never a manifest.
		const manifest = this.#manifest ?? getAmbientManifest();
		return handleRequest(new FetchState(manifest, request, options));
	};
}

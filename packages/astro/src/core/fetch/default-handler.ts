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
	 * `BaseApp` passes itself so states resolve that app's manifest ahead of
	 * the ambient one; generated builds construct the handler with no
	 * arguments and use the ambient manifest.
	 */
	constructor(app?: { manifest: SSRManifest }) {
		this.#manifest = app?.manifest;
	}

	fetch: FetchHandler = (request) => {
		const options = getRenderOptions(request);
		// Ambient-only manifest resolution: the render-options record
		// carries only genuine `render()` inputs — never a manifest.
		const manifest = this.#manifest ?? getAmbientManifest();
		return handleRequest(new FetchState(manifest, request, options));
	};
}

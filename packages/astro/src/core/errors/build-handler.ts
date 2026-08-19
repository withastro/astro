import type { RenderErrorOptions } from '../app/base.js';
import type { SSRManifest } from '../app/types.js';
import { renderDefaultError } from './default-handler.js';

/**
 * The error strategy used during static build / prerendering.
 *
 * - For 500 errors, returns the original response if present, otherwise
 *   throws so the build surfaces the underlying error to the developer.
 * - For other errors (e.g. 404), delegates to `renderDefaultError` with
 *   `prerenderedErrorPageFetch` cleared (the build pipeline can't fetch
 *   prerendered pages the way production SSR can).
 */
export async function renderBuildError(
	manifest: SSRManifest,
	request: Request,
	options: RenderErrorOptions,
): Promise<Response> {
	if (options.status === 500) {
		if (options.response) {
			return options.response;
		}
		throw options.error;
	}
	return renderDefaultError(manifest, request, {
		...options,
		prerenderedErrorPageFetch: undefined,
	});
}

import {
	appendForwardSlash,
	collapseDuplicateTrailingSlashes,
	hasFileExtension,
	isInternalPath,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import type { BaseApp } from '../app/base.js';
import type { Pipeline } from '../base-pipeline.js';
import type { FetchState } from '../fetch/fetch-state.js';
import { prepareResponse } from '../app/prepare-response.js';
import { redirectTemplate } from './3xx.js';

/**
 * Handles trailing-slash normalization for incoming requests. If the
 * request's pathname does not match the app's configured `trailingSlash`
 * policy, a redirect response is returned. Otherwise, returns `undefined`
 * so the caller can continue processing the request.
 */
export class TrailingSlashHandler {
	#app: BaseApp<Pipeline>;

	constructor(app: BaseApp<Pipeline>) {
		this.#app = app;
	}

	/**
	 * Returns a redirect `Response` if the request pathname needs
	 * normalization, or `undefined` if no redirect is required.
	 */
	handle(state: FetchState): Response | undefined {
		// Use the raw pathname/search captured by the FetchState constructor
		// (before normalization) so we see the un-normalized pathname (e.g.
		// duplicate slashes like `///`). state.url has already been normalized,
		// which would hide the redirect targets. Reusing the captured values
		// avoids re-parsing the request URL on every request.
		const pathname = state.rawPathname;
		const redirect = this.#redirectTrailingSlash(pathname);

		// Not a redirect.
		if (redirect === pathname) {
			return undefined;
		}

		const addCookieHeader = state.renderOptions.addCookieHeader;
		const status = state.request.method === 'GET' ? 301 : 308;
		const response = new Response(
			redirectTemplate({
				status,
				relativeLocation: pathname,
				absoluteLocation: redirect,
				from: state.request.url,
			}),
			{
				status,
				headers: {
					location: redirect + state.rawSearch,
				},
			},
		);
		prepareResponse(response, { addCookieHeader });
		return response;
	}

	#redirectTrailingSlash(pathname: string): string {
		const { trailingSlash } = this.#app.manifest;

		// Ignore root and internal paths
		if (pathname === '/' || isInternalPath(pathname)) {
			return pathname;
		}

		// Redirect multiple trailing slashes to collapsed path
		const path = collapseDuplicateTrailingSlashes(pathname, trailingSlash !== 'never');
		if (path !== pathname) {
			return path;
		}

		if (trailingSlash === 'ignore') {
			return pathname;
		}

		if (trailingSlash === 'always' && !hasFileExtension(pathname)) {
			return appendForwardSlash(pathname);
		}
		if (trailingSlash === 'never') {
			return removeTrailingForwardSlash(pathname);
		}

		return pathname;
	}
}

import {
	appendForwardSlash,
	collapseDuplicateTrailingSlashes,
	hasFileExtension,
	isInternalPath,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import type { BaseApp } from '../app/base.js';
import { prepareResponse } from '../app/prepare-response.js';
import { getRenderOptions } from '../app/render-options.js';
import { redirectTemplate } from './3xx.js';

/**
 * Handles trailing-slash normalization for incoming requests. If the
 * request's pathname does not match the app's configured `trailingSlash`
 * policy, a redirect response is returned. Otherwise, returns `undefined`
 * so the caller can continue processing the request.
 */
export class TrailingSlashHandler {
	#app: BaseApp<any>;

	constructor(app: BaseApp<any>) {
		this.#app = app;
	}

	/**
	 * Returns a redirect `Response` if the request pathname needs
	 * normalization, or `undefined` if no redirect is required.
	 */
	handle(request: Request): Response | undefined {
		const url = new URL(request.url);
		const redirect = this.#redirectTrailingSlash(url.pathname);

		// Not a redirect.
		if (redirect === url.pathname) {
			return undefined;
		}

		const addCookieHeader = getRenderOptions(request)?.addCookieHeader ?? false;
		const status = request.method === 'GET' ? 301 : 308;
		const response = new Response(
			redirectTemplate({
				status,
				relativeLocation: url.pathname,
				absoluteLocation: redirect,
				from: request.url,
			}),
			{
				status,
				headers: {
					location: redirect + url.search,
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

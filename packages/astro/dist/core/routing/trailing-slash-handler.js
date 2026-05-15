import {
	appendForwardSlash,
	collapseDuplicateTrailingSlashes,
	hasFileExtension,
	isInternalPath,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import { prepareResponse } from '../app/prepare-response.js';
import { redirectTemplate } from './3xx.js';
class TrailingSlashHandler {
	#app;
	constructor(app) {
		this.#app = app;
	}
	/**
	 * Returns a redirect `Response` if the request pathname needs
	 * normalization, or `undefined` if no redirect is required.
	 */
	handle(state) {
		const url = new URL(state.request.url);
		const redirect = this.#redirectTrailingSlash(url.pathname);
		if (redirect === url.pathname) {
			return void 0;
		}
		const addCookieHeader = state.renderOptions.addCookieHeader;
		const status = state.request.method === 'GET' ? 301 : 308;
		const response = new Response(
			redirectTemplate({
				status,
				relativeLocation: url.pathname,
				absoluteLocation: redirect,
				from: state.request.url,
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
	#redirectTrailingSlash(pathname) {
		const { trailingSlash } = this.#app.manifest;
		if (pathname === '/' || isInternalPath(pathname)) {
			return pathname;
		}
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
export { TrailingSlashHandler };

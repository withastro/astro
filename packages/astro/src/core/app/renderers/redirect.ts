import { computeRedirectStatus, resolveRedirectTarget } from '../../redirects/render.js';
import { getParams } from '../../render/params-and-props.js';
import type { RouteData } from '../../../types/public/internal.js';
import type { SSRManifest } from '../../../types/public/index.js';

/**
 * Renders redirect routes. This class is framework-agnostic and does not
 * depend on Hono APIs.
 */
export class RedirectRenderer {
	#manifest: SSRManifest;

	constructor(manifest: SSRManifest) {
		this.#manifest = manifest;
	}

	render(request: Request, routeData: RouteData): Response {
		const url = new URL(request.url);
		const params = getParams(routeData, url.pathname);
		const status = computeRedirectStatus(request.method, routeData.redirect, routeData.redirectRoute);
		const location = resolveRedirectTarget(
			params,
			routeData.redirect,
			routeData.redirectRoute,
			this.#manifest.trailingSlash,
		);
		return new Response(null, { status, headers: { location } });
	}
}

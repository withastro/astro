import {
	appendForwardSlash,
	collapseDuplicateTrailingSlashes,
	hasFileExtension,
	isInternalPath,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import type { SSRManifest } from '../../types/public/index.js';

/**
 * Checks whether the request needs a trailing-slash redirect and returns
 * the redirect Response if so, or `undefined` to continue normally.
 */
export function handleTrailingSlash(request: Request, manifest: SSRManifest): Response | undefined {
	const url = new URL(request.url);
	const { pathname } = url;
	const { trailingSlash } = manifest;

	if (pathname === '/' || isInternalPath(pathname)) {
		return undefined;
	}

	// Always collapse duplicate trailing slashes, regardless of trailingSlash setting.
	const collapsed = collapseDuplicateTrailingSlashes(pathname, trailingSlash !== 'never');
	if (collapsed !== pathname) {
		const status = request.method === 'GET' ? 301 : 308;
		return new Response(null, { status, headers: { Location: collapsed + url.search } });
	}

	if (trailingSlash === 'always' && !hasFileExtension(pathname)) {
		const withSlash = appendForwardSlash(pathname);
		if (withSlash !== pathname) {
			const status = request.method === 'GET' ? 301 : 308;
			return new Response(null, { status, headers: { Location: withSlash + url.search } });
		}
	}

	if (trailingSlash === 'never') {
		const withoutSlash = removeTrailingForwardSlash(pathname);
		if (withoutSlash !== pathname) {
			const status = request.method === 'GET' ? 301 : 308;
			return new Response(null, { status, headers: { Location: withoutSlash + url.search } });
		}
	}

	return undefined;
}

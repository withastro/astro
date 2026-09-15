import { prependForwardSlash, stripRequestBase } from '@astrojs/internal-helpers/path';
import type { RouteData } from '../../types/public/internal.js';
import type { SSRManifest } from '../app/types.js';
import { computePathnameFromDomain } from '../i18n/domain.js';
import { AstroIntegrationLogger } from '../logger/core.js';
import { getLogger } from '../logger/manifest-logger.js';
import { validateAndDecodePathname } from '../util/pathname.js';
import { matchAllRoutes, matchRoute } from './route-table.js';

/**
 * Fully decodes a pathname, falling back to a single decode and then the raw pathname
 * when validation fails. Matching runs before `render()`, so it must not throw for
 * request input that render-time validation handles.
 */
function safeDecodePathname(manifest: SSRManifest, pathname: string): string {
	try {
		return validateAndDecodePathname(pathname);
	} catch (e: any) {
		// Path decoding failures are request input rather than a server fault. Log at
		// `debug` so they stay diagnosable without flooding error logs. The logger is
		// allocated lazily with the same options and label as the facade's `adapterLogger`.
		new AstroIntegrationLogger(getLogger(manifest).options, manifest.adapterName).debug(
			e.toString(),
		);
		try {
			return decodeURI(pathname);
		} catch {
			return pathname;
		}
	}
}

/**
 * Given a `Request`, returns the `RouteData` that matches its pathname — the
 * appless, purely functional body of `BaseApp.match()`. By default, prerendered
 * routes aren't returned, even if they are matched; when
 * `allowPrerenderedRoutes` is `true`, matched prerendered routes are returned
 * too.
 */
export function matchRequest(
	manifest: SSRManifest,
	request: Request,
	allowPrerenderedRoutes = false,
): RouteData | undefined {
	const url = new URL(request.url);
	// ignore requests matching public assets
	if (manifest.assets.has(url.pathname)) return undefined;
	let pathname = computePathnameFromDomain(
		request,
		url,
		manifest.i18n,
		manifest.base,
		manifest.trailingSlash,
		getLogger(manifest),
	);
	if (!pathname) {
		pathname = prependForwardSlash(stripRequestBase(url.pathname, manifest.base));
	}
	pathname = safeDecodePathname(manifest, pathname);
	const routeData = matchRoute(manifest, pathname);
	if (!routeData) return undefined;
	if (allowPrerenderedRoutes) {
		return routeData;
	}
	// Prerendered routes are served as static files by the hosting layer.
	// When the first match is a prerendered *dynamic* route, try to find
	// a non-prerendered route that can serve this path. Dynamic prerendered
	// routes only cover their specific static paths, so an SSR route with
	// the same pattern should handle all other URLs.
	if (routeData.prerender) {
		if (routeData.params.length > 0) {
			const allMatches = matchAllRoutes(manifest, pathname);
			return allMatches.find((r) => !r.prerender);
		}
		return undefined;
	}
	return routeData;
}

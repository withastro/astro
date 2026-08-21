import { prependForwardSlash, stripRequestBase } from '@astrojs/internal-helpers/path';
import type { RouteData } from '../../types/public/internal.js';
import type { SSRManifest } from '../app/types.js';
import { computePathnameFromDomain } from '../i18n/domain.js';
import { AstroIntegrationLogger } from '../logger/core.js';
import { getLogger } from '../logger/manifest-logger.js';
import { matchAllRoutes, matchRoute } from './route-table.js';

/**
 * Decodes a pathname with `decodeURI`, falling back to the raw pathname when it
 * contains an invalid percent-sequence (e.g. `%C0%AF`, an overlong-UTF-8 encoding of
 * `/` commonly sent by path-traversal scanners). A raw `decodeURI()` would throw
 * `URIError: URI malformed`, and because `match()` runs before `render()` that error
 * escapes the adapter's request handler as an uncaught exception (HTTP 500) that user
 * middleware can't catch.
 */
function safeDecodeURI(manifest: SSRManifest, pathname: string): string {
	try {
		return decodeURI(pathname);
	} catch (e: any) {
		// Malformed request paths are expected client input (commonly from automated
		// scanners) rather than a server fault, and this runs per-request on the hot
		// path. Log at `debug` so it stays diagnosable without flooding error logs.
		// Allocated lazily — only on the malformed branch — with the same options
		// and label as the facade's `adapterLogger`.
		new AstroIntegrationLogger(getLogger(manifest).options, manifest.adapterName).debug(
			e.toString(),
		);
		return pathname;
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
	const routeData = matchRoute(manifest, safeDecodeURI(manifest, pathname));
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
			const allMatches = matchAllRoutes(manifest, safeDecodeURI(manifest, pathname));
			return allMatches.find((r) => !r.prerender);
		}
		return undefined;
	}
	return routeData;
}

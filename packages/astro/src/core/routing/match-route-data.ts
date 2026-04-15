import {
	appendForwardSlash,
	joinPaths,
	prependForwardSlash,
	removeBase,
} from '@astrojs/internal-helpers/path';
import { normalizeTheLocale } from '../../i18n/index.js';
import type { SSRManifest } from '../../types/public/index.js';
import type { RouteData } from '../../types/public/internal.js';
import type { Pipeline } from '../base-pipeline.js';
import { getRenderOptions } from '../app/render-options-store.js';

// ---------------------------------------------------------------------------
// Domain locale resolution
// ---------------------------------------------------------------------------

function resolveDomainLocale(request: Request, manifest: SSRManifest): string | undefined {
	const i18n = manifest.i18n;
	if (
		!i18n ||
		(i18n.strategy !== 'domains-prefix-always' &&
			i18n.strategy !== 'domains-prefix-other-locales' &&
			i18n.strategy !== 'domains-prefix-always-no-redirect')
	) {
		return undefined;
	}

	const url = new URL(request.url);
	let host = request.headers.get('X-Forwarded-Host');
	let protocol = request.headers.get('X-Forwarded-Proto');
	if (protocol) {
		protocol = protocol + ':';
	} else {
		protocol = url.protocol;
	}
	if (!host) {
		host = request.headers.get('Host');
	}
	if (!host || !protocol) return undefined;

	host = host.split(':')[0];
	try {
		const hostAsUrl = new URL(`${protocol}//${host}`);
		for (const [domainKey, localeValue] of Object.entries(i18n.domainLookupTable)) {
			const domainKeyAsUrl = new URL(domainKey);
			if (
				hostAsUrl.host === domainKeyAsUrl.host &&
				hostAsUrl.protocol === domainKeyAsUrl.protocol
			) {
				return localeValue;
			}
		}
	} catch {
		// Invalid URL
	}
	return undefined;
}

// ---------------------------------------------------------------------------
// Route matching
// ---------------------------------------------------------------------------

export interface MatchRouteDataDeps {
	pipeline: Pipeline;
	manifest: SSRManifest;
}

/**
 * Creates a route matching function for the SSR runtime.
 * Matches a request URL against the manifest's route patterns,
 * handling base path stripping, build format normalization, and
 * domain-based i18n locale resolution.
 */
export function createMatchRouteData(deps: MatchRouteDataDeps) {
	return function matchRouteData(request: Request, { allowPrerenderedRoutes = false } = {}): RouteData | undefined {
		// If the adapter already matched a route (e.g. via devMatch), use it
		// directly instead of re-matching. This is needed because some adapters
		// (like Cloudflare) run route matching in their own handler before
		// calling app.render().
		const preMatched = getRenderOptions(request)?.routeData;
		if (preMatched) return preMatched;

		const manifest = deps.manifest;
		const manifestData = deps.pipeline.manifestData;
		const url = new URL(request.url);
		if (manifest.assets.has(url.pathname)) return undefined;
		let strippedPathname = removeBase(decodeURI(url.pathname), manifest.base) || '/';

		// When build.format is 'file', request URLs may contain .html or
		// /index.html suffixes (e.g. from getUrlForPath during SSG).
		// Normalize them away so the route patterns can match.
		if (manifest.buildFormat === 'file') {
			if (strippedPathname.endsWith('/index.html')) {
				const trimmed = strippedPathname.slice(0, -'/index.html'.length);
				strippedPathname = trimmed === '' ? '/' : trimmed;
			} else if (strippedPathname.endsWith('.html')) {
				const trimmed = strippedPathname.slice(0, -'.html'.length);
				strippedPathname = trimmed === '' ? '/' : trimmed;
			}
		}

		// For domain-based i18n, prepend the resolved locale to the pathname
		const domainLocale = resolveDomainLocale(request, manifest);
		if (domainLocale) {
			strippedPathname = prependForwardSlash(
				joinPaths(normalizeTheLocale(domainLocale), strippedPathname),
			);
			if (url.pathname.endsWith('/')) {
				strippedPathname = appendForwardSlash(strippedPathname);
			}
		}

		for (const route of manifestData.routes) {
			if (route.pattern.test(strippedPathname) || (manifest.trailingSlash === 'never' && strippedPathname === '/' && route.pattern.test(''))) {
				// If the matching route is prerendered and we're not allowing
				// prerendered routes, return undefined immediately. This prevents
				// catch-all routes from handling paths that belong to prerendered
				// routes (which are served as static assets by the adapter).
				if (!allowPrerenderedRoutes && route.prerender) return undefined;
				return route;
			}
		}
		return undefined;
	};
}

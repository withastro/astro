import { appendForwardSlash } from '@astrojs/internal-helpers/path';
import { computeFallbackRoute } from '../../i18n/fallback.js';
import { I18nRouter, type I18nRouterContext } from '../../i18n/router.js';
import { markFeatureUsed, FetchFeatures } from '../fetch/features.js';
import type { SSRManifest } from '../app/types.js';
import { shouldAppendForwardSlash } from '../build/util.js';
import type { FetchState } from '../fetch/fetch-state.js';
import { createManifestMemo } from '../manifest/memo.js';

/**
 * The compiled i18n configuration for a manifest: the config values plus the
 * `I18nRouter` (with its inverted domain lookup table), compiled once and
 * reused across requests.
 */
export interface CompiledI18n {
	config: NonNullable<SSRManifest['i18n']>;
	base: SSRManifest['base'];
	trailingSlash: SSRManifest['trailingSlash'];
	format: SSRManifest['buildFormat'];
	router: I18nRouter;
}

/**
 * Pure compile from explicit values — used by `astro:i18n`'s manual-mode
 * middleware wrapper (`src/i18n/middleware.ts`), which receives the values as
 * arguments rather than reading a manifest.
 */
export function compileI18n(
	i18n: NonNullable<SSRManifest['i18n']>,
	base: SSRManifest['base'],
	trailingSlash: SSRManifest['trailingSlash'],
	format: SSRManifest['buildFormat'],
): CompiledI18n {
	const router = new I18nRouter({
		strategy: i18n.strategy,
		defaultLocale: i18n.defaultLocale,
		locales: i18n.locales,
		base,
		domains: i18n.domainLookupTable
			? Object.keys(i18n.domainLookupTable).reduce(
					(acc, domain) => {
						const locale = i18n.domainLookupTable[domain];
						if (!acc[domain]) {
							acc[domain] = [];
						}
						acc[domain].push(locale);
						return acc;
					},
					{} as Record<string, string[]>,
				)
			: undefined,
	});
	return { config: i18n, base, trailingSlash, format, router };
}

// `null` sentinel means "i18n not configured OR strategy is manual" — for the
// manual strategy users wire `astro:i18n.middleware(...)` into their own
// `onRequest` instead. No HMR invalidation needed: i18n config is static per
// manifest object (a dev manifest re-evaluation creates a new object and the
// memo follows).
const i18nMemo = createManifestMemo<CompiledI18n | null>((manifest) => {
	const config = manifest.i18n;
	return config && config.strategy !== 'manual'
		? compileI18n(config, manifest.base, manifest.trailingSlash, manifest.buildFormat)
		: null;
});

/**
 * The compiled i18n post-processor for a manifest, or `null` when i18n is
 * unset or the routing strategy is `manual`.
 */
export function getI18n(manifest: SSRManifest): CompiledI18n | null {
	return i18nMemo.get(manifest);
}

/**
 * Post-processes a rendered `Response` against the compiled i18n
 * configuration, as an explicit step in `handleRequest` after the middleware
 * chain returns. The manual-strategy public API (`astro:i18n.middleware(...)`)
 * wraps this in a middleware-shaped closure.
 */
export async function finalizeI18n(
	compiled: CompiledI18n,
	state: FetchState,
	response: Response,
): Promise<Response> {
	markFeatureUsed(state.manifest, FetchFeatures.i18n);
	const i18n = compiled.config;

	// This is a case where we are internally rendering a 404/500, so we
	// need to bypass checks that were done already.
	if (state.skipErrorReroute && typeof i18n.fallback === 'undefined') {
		return response;
	}

	// If the route we're processing is not a page, then we ignore it
	if (state.responseRouteType !== 'page' && state.responseRouteType !== 'fallback') {
		return response;
	}

	// Use Astro's already-decoded URL (`state.url`) instead of reading the
	// raw request URL again, so locale checks use the same path as routing.
	const url = state.url;
	const currentLocale = state.computeCurrentLocale();
	const isPrerendered = state.routeData!.prerender;

	// Build context for router (responseRouteType is guaranteed to be 'page' | 'fallback' here)
	const routerContext: I18nRouterContext = {
		currentLocale,
		currentDomain: url.hostname,
		routeType: state.responseRouteType,
		isReroute: false,
	};

	// Step 1: Apply routing strategy
	const routeDecision = compiled.router.match(url.pathname, routerContext);

	switch (routeDecision.type) {
		case 'redirect': {
			// Apply trailing slash if needed
			let location = routeDecision.location;
			if (shouldAppendForwardSlash(compiled.trailingSlash, compiled.format)) {
				location = appendForwardSlash(location);
			}
			return new Response(null, {
				status: routeDecision.status ?? 302,
				headers: { Location: location },
			});
		}
		case 'notFound': {
			if (isPrerendered) {
				// Prerendered pages are authored content — preserve the body so the
				// build pipeline can write the file. The REROUTE_DIRECTIVE prevents
				// the App from rerouting to the error page.
				const prerenderedRes = new Response(response.body, {
					status: 404,
					headers: response.headers,
				});
				state.skipErrorReroute = true;
				if (routeDecision.location) {
					prerenderedRes.headers.set('Location', routeDecision.location);
				}
				return prerenderedRes;
			}
			// For SSR, return a null-body 404 so the App reroutes to the actual
			// 404 page. This prevents dynamic routes like [locale] from serving
			// their content for invalid locale paths.
			const headers = new Headers();
			if (routeDecision.location) {
				headers.set('Location', routeDecision.location);
			}
			return new Response(null, { status: 404, headers });
		}
		case 'continue':
			break; // Continue to fallback check
	}

	// Step 2: Apply fallback logic (if configured)
	if (i18n.fallback && i18n.fallbackType) {
		// The fallback sentinel (X-Astro-Route-Type: fallback, status 500) signals
		// that the render pipeline couldn't find this page in the current locale.
		// Treat it as a 404 so computeFallbackRoute will apply fallback logic.
		const effectiveStatus = state.responseRouteType === 'fallback' ? 404 : response.status;
		const fallbackDecision = computeFallbackRoute({
			pathname: url.pathname,
			responseStatus: effectiveStatus,
			currentLocale,
			fallback: i18n.fallback,
			fallbackType: i18n.fallbackType,
			locales: i18n.locales,
			defaultLocale: i18n.defaultLocale,
			strategy: i18n.strategy,
			base: compiled.base,
		});

		switch (fallbackDecision.type) {
			case 'redirect':
				return new Response(null, {
					status: 302,
					headers: { Location: fallbackDecision.pathname + url.search },
				});
			case 'rewrite':
				try {
					return await state.rewrite(fallbackDecision.pathname + url.search);
				} catch {
					// The rewrite target has no renderable page either (e.g. a
					// prerendered dynamic route where the slug is excluded from
					// getStaticPaths in the fallback locale too). Fall through
					// so the original 404 response is returned. See #17778.
					break;
				}
			case 'none':
				break;
		}
	}

	return response;
}

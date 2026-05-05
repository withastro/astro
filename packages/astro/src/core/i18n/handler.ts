import { appendForwardSlash } from '@astrojs/internal-helpers/path';
import { computeFallbackRoute } from '../../i18n/fallback.js';
import { I18nRouter, type I18nRouterContext } from '../../i18n/router.js';
import { PipelineFeatures } from '../base-pipeline.js';
import type { SSRManifest } from '../app/types.js';
import { shouldAppendForwardSlash } from '../build/util.js';
import { REROUTE_DIRECTIVE_HEADER, ROUTE_TYPE_HEADER } from '../constants.js';
import type { FetchState } from '../fetch/fetch-state.js';

/**
 * Post-processes a rendered `Response` against the app's i18n
 * configuration. This is the logic that previously ran as the internal
 * `createI18nMiddleware` middleware — lifted out of the middleware layer
 * so it runs as an explicit step in `AstroHandler.render` after the
 * middleware chain returns.
 *
 * Public entry points in `astro:i18n` (`createMiddleware`) preserve the
 * middleware-shaped API by wrapping an `I18n` instance in a
 * `MiddlewareHandler` closure.
 */
export class I18n {
	#i18n: NonNullable<SSRManifest['i18n']>;
	#base: SSRManifest['base'];
	#trailingSlash: SSRManifest['trailingSlash'];
	#format: SSRManifest['buildFormat'];
	#router: I18nRouter;

	constructor(
		i18n: NonNullable<SSRManifest['i18n']>,
		base: SSRManifest['base'],
		trailingSlash: SSRManifest['trailingSlash'],
		format: SSRManifest['buildFormat'],
	) {
		this.#i18n = i18n;
		this.#base = base;
		this.#trailingSlash = trailingSlash;
		this.#format = format;
		this.#router = new I18nRouter({
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
	}

	async finalize(state: FetchState, response: Response): Promise<Response> {
		state.pipeline.usedFeatures |= PipelineFeatures.i18n;
		const i18n = this.#i18n;
		const typeHeader = response.headers.get(ROUTE_TYPE_HEADER);

		// This is a case where we are internally rendering a 404/500, so we
		// need to bypass checks that were done already.
		const isReroute = response.headers.get(REROUTE_DIRECTIVE_HEADER);
		if (isReroute === 'no' && typeof i18n.fallback === 'undefined') {
			return response;
		}

		// If the route we're processing is not a page, then we ignore it
		if (typeHeader !== 'page' && typeHeader !== 'fallback') {
			return response;
		}

		const url = new URL(state.request.url);
		const currentLocale = state.computeCurrentLocale();
		const isPrerendered = state.routeData!.prerender;

		// Build context for router (typeHeader is guaranteed to be 'page' | 'fallback' here)
		const routerContext: I18nRouterContext = {
			currentLocale,
			currentDomain: url.hostname,
			routeType: typeHeader as 'page' | 'fallback',
			isReroute: isReroute === 'yes',
		};

		// Step 1: Apply routing strategy
		const routeDecision = this.#router.match(url.pathname, routerContext);

		switch (routeDecision.type) {
			case 'redirect': {
				// Apply trailing slash if needed
				let location = routeDecision.location;
				if (shouldAppendForwardSlash(this.#trailingSlash, this.#format)) {
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
					prerenderedRes.headers.set(REROUTE_DIRECTIVE_HEADER, 'no');
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
			const effectiveStatus = typeHeader === 'fallback' ? 404 : response.status;
			const fallbackDecision = computeFallbackRoute({
				pathname: url.pathname,
				responseStatus: effectiveStatus,
				currentLocale,
				fallback: i18n.fallback,
				fallbackType: i18n.fallbackType,
				locales: i18n.locales,
				defaultLocale: i18n.defaultLocale,
				strategy: i18n.strategy,
				base: this.#base,
			});

			switch (fallbackDecision.type) {
				case 'redirect':
					return new Response(null, {
						status: 302,
						headers: { Location: fallbackDecision.pathname + url.search },
					});
				case 'rewrite':
					return await state.rewrite(fallbackDecision.pathname + url.search);
				case 'none':
					break;
			}
		}

		return response;
	}
}

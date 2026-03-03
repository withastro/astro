import { appendForwardSlash } from '@astrojs/internal-helpers/path';
import type { SSRManifest } from '../core/app/types.js';
import { shouldAppendForwardSlash } from '../core/build/util.js';
import { REROUTE_DIRECTIVE_HEADER, ROUTE_TYPE_HEADER } from '../core/constants.js';
import type { MiddlewareHandler } from '../types/public/common.js';
import { computeFallbackRoute } from './fallback.js';
import { I18nRouter, type I18nRouterContext } from './router.js';

export function createI18nMiddleware(
	i18n: SSRManifest['i18n'],
	base: SSRManifest['base'],
	trailingSlash: SSRManifest['trailingSlash'],
	format: SSRManifest['buildFormat'],
): MiddlewareHandler {
	if (!i18n) return (_, next) => next();

	// Create router once during middleware initialization
	const i18nRouter = new I18nRouter({
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

	return async (context, next) => {
		const response = await next();
		const typeHeader = response.headers.get(ROUTE_TYPE_HEADER);

		// This is case where we are internally rendering a 404/500, so we need to bypass checks that were done already
		const isReroute = response.headers.get(REROUTE_DIRECTIVE_HEADER);
		if (isReroute === 'no' && typeof i18n.fallback === 'undefined') {
			return response;
		}

		// If the route we're processing is not a page, then we ignore it
		if (typeHeader !== 'page' && typeHeader !== 'fallback') {
			return response;
		}

		// Build context for router (typeHeader is guaranteed to be 'page' | 'fallback' here)
		const routerContext: I18nRouterContext = {
			currentLocale: context.currentLocale,
			currentDomain: context.url.hostname,
			routeType: typeHeader as 'page' | 'fallback',
			isReroute: isReroute === 'yes',
		};

		// Step 1: Apply routing strategy
		const routeDecision = i18nRouter.match(context.url.pathname, routerContext);

		switch (routeDecision.type) {
			case 'redirect': {
				// Apply trailing slash if needed
				let location = routeDecision.location;
				if (shouldAppendForwardSlash(trailingSlash, format)) {
					location = appendForwardSlash(location);
				}
				return context.redirect(location, routeDecision.status);
			}
			case 'notFound': {
				const notFoundRes = new Response(response.body, {
					status: 404,
					headers: response.headers,
				});
				notFoundRes.headers.set(REROUTE_DIRECTIVE_HEADER, 'no');
				if (routeDecision.location) {
					notFoundRes.headers.set('Location', routeDecision.location);
				}
				return notFoundRes;
			}
			case 'continue':
				break; // Continue to fallback check
		}

		// Step 2: Apply fallback logic (if configured)
		if (i18n.fallback && i18n.fallbackType) {
			const fallbackDecision = computeFallbackRoute({
				pathname: context.url.pathname,
				responseStatus: response.status,
				currentLocale: context.currentLocale,
				fallback: i18n.fallback,
				fallbackType: i18n.fallbackType,
				locales: i18n.locales,
				defaultLocale: i18n.defaultLocale,
				strategy: i18n.strategy,
				base,
			});

			switch (fallbackDecision.type) {
				case 'redirect':
					return context.redirect(fallbackDecision.pathname + context.url.search);
				case 'rewrite':
					return await context.rewrite(fallbackDecision.pathname + context.url.search);
				case 'none':
					break;
			}
		}

		return response;
	};
}

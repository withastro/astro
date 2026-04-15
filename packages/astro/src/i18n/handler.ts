import { removeBase } from '@astrojs/internal-helpers/path';
import type { RouteData } from '../types/public/internal.js';
import type { SSRManifest } from '../types/public/index.js';
import type { FetchState } from '../core/app/fetch-state.js';
import { computeCurrentLocale } from './utils.js';
import { computeFallbackRoute } from './fallback.js';
import { I18nRouter, type I18nRouterContext } from './router.js';

/**
 * Creates a post-processing handler for i18n routing decisions.
 *
 * After downstream middleware renders the page, this handler inspects the
 * response and applies i18n routing rules:
 * - Redirect (e.g. `/foo` → `/en/foo`)
 * - Not found (locale path shouldn't exist → 404)
 * - Fallback (404 response triggers redirect or rewrite to default locale)
 *
 * Returns a new Response when i18n overrides the downstream result, or
 * `undefined` when no i18n action is needed.
 *
 * The `matchRouteData` callback is used to resolve the route if not already
 * on the FetchState.
 */
export function createI18nHandler(
	manifest: SSRManifest,
	matchRouteData: (req: Request) => RouteData | undefined,
): ((state: FetchState, response: Response | undefined) => Response | undefined) | undefined {
	const i18nConfig = manifest.i18n;
	if (!i18nConfig || i18nConfig.strategy === 'manual') {
		return undefined;
	}

	const i18nRouter = new I18nRouter({
		strategy: i18nConfig.strategy,
		defaultLocale: i18nConfig.defaultLocale,
		locales: i18nConfig.locales,
		base: manifest.base,
		domains: i18nConfig.domainLookupTable
			? Object.keys(i18nConfig.domainLookupTable).reduce(
					(acc, domain) => {
						const locale = i18nConfig.domainLookupTable[domain];
						if (!acc[domain]) acc[domain] = [];
						acc[domain].push(locale);
						return acc;
					},
					{} as Record<string, string[]>,
				)
			: undefined,
	});

	return (state: FetchState, response: Response | undefined): Response | undefined => {
		// Resolve route if not already set.
		if (state.routeData === undefined) {
			state.routeData = matchRouteData(state.request);
		}
		const routeType = state.routeData?.type;

		// Only process page and fallback routes.
		if (routeType !== 'page' && routeType !== 'fallback') {
			return undefined;
		}

		const requestUrl = new URL(state.request.url);
		const currentLocale = computeCurrentLocale(
			removeBase(requestUrl.pathname, manifest.base),
			i18nConfig.locales,
			i18nConfig.defaultLocale,
		);

		const routerContext: I18nRouterContext = {
			currentLocale,
			currentDomain: requestUrl.hostname,
			routeType,
			isReroute: false,
		};

		const routeDecision = i18nRouter.match(requestUrl.pathname, routerContext);
		switch (routeDecision.type) {
			case 'redirect':
				return new Response(null, {
					status: routeDecision.status,
					headers: { Location: routeDecision.location },
				});
			case 'notFound': {
				if (!response) return undefined;
				const notFoundRes = new Response(response.body, { status: 404, headers: response.headers });
				if (routeDecision.location) notFoundRes.headers.set('Location', routeDecision.location);
				return notFoundRes;
			}
			case 'continue':
				break;
		}

		if (!response) return undefined;

		if (i18nConfig.fallback && i18nConfig.fallbackType) {
			const fallbackDecision = computeFallbackRoute({
				pathname: requestUrl.pathname,
				responseStatus: response.status,
				currentLocale,
				fallback: i18nConfig.fallback,
				fallbackType: i18nConfig.fallbackType,
				locales: i18nConfig.locales,
				defaultLocale: i18nConfig.defaultLocale,
				strategy: i18nConfig.strategy,
				base: manifest.base,
			});

			switch (fallbackDecision.type) {
				case 'redirect':
					return new Response(null, {
						status: 302,
						headers: { Location: fallbackDecision.pathname + requestUrl.search },
					});
				case 'rewrite':
					state.rewritePathname = fallbackDecision.pathname + requestUrl.search;
					return undefined;
				case 'none':
					break;
			}
		}

		return undefined;
	};
}

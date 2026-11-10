import {
	computeCurrentLocale as computeCurrentLocaleUtil,
	computeCurrentLocaleFromParams,
	computePreferredLocale as computePreferredLocaleUtil,
	computePreferredLocaleList as computePreferredLocaleListUtil,
} from '../../i18n/utils.js';
import type { FetchState } from '@astrojs/vite-plugin-router/_internal/core/fetch/fetch-state.js';
import {
	isRoute404or500,
	isRouteServerIsland,
} from '@astrojs/vite-plugin-router/_internal/core/routing/match.js';

const currentLocales = new WeakMap<FetchState, string>();

/**
 * The locale of the request (`Astro.currentLocale`), derived from the matched route, its params
 * and, for server islands, the referer. Cached per request once a locale is found.
 */
export function computeCurrentLocale(state: FetchState): string | undefined {
	const {
		url,
		manifest: { i18n },
		routeData,
	} = state;
	if (!i18n || !routeData) return;

	const { defaultLocale, locales, strategy } = i18n;

	const fallbackTo =
		strategy === 'pathname-prefix-other-locales' || strategy === 'domains-prefix-other-locales'
			? defaultLocale
			: undefined;

	const cached = currentLocales.get(state);
	if (cached) {
		return cached;
	}

	let computedLocale;
	if (isRouteServerIsland(routeData)) {
		let referer = state.request.headers.get('referer');
		if (referer) {
			if (URL.canParse(referer)) {
				referer = new URL(referer).pathname;
			}
			computedLocale = computeCurrentLocaleUtil(referer, locales, defaultLocale);
		}
	} else {
		let pathname = routeData.pathname;
		// For domain-based i18n the locale prefix comes from the Host header,
		// not the URL. `state.pathname` carries the locale-prefixed path the
		// route matched against (e.g. `/en/boats/1/foo`), whereas `url.pathname`
		// does not. This matters for dynamic routes, which have no static
		// `routeData.pathname` to fall back to. See #16854.
		if (state.domainPathname) {
			pathname = state.pathname;
		} else if (url && !routeData.pattern.test(url.pathname)) {
			for (const fallbackRoute of routeData.fallbackRoutes) {
				if (fallbackRoute.pattern.test(url.pathname)) {
					pathname = fallbackRoute.pathname;
					break;
				}
			}
		}
		pathname =
			pathname && !isRoute404or500(routeData) ? pathname : (url.pathname ?? state.pathname);
		computedLocale = computeCurrentLocaleUtil(pathname, locales, defaultLocale);
		// routeData.params is the route's parameter *names* (e.g. ['lang']);
		// state.params is the resolved *values* for this request (e.g. { lang: 'en' }).
		// If the route has parameters, the locale may be embedded in them.
		if (routeData.params.length > 0) {
			// SAFETY: routeData is set (guarded above), so the params getter resolves.
			const localeFromParams = computeCurrentLocaleFromParams(state.params!, locales);
			if (localeFromParams) {
				computedLocale = localeFromParams;
			}
		}
	}

	const locale = computedLocale ?? fallbackTo;
	if (locale) currentLocales.set(state, locale);
	return locale;
}

/** `Astro.preferredLocale`: the best match between `Accept-Language` and the configured locales. */
export function computePreferredLocale(state: FetchState): string | undefined {
	const { i18n } = state.manifest;
	if (!i18n) return;
	return computePreferredLocaleUtil(state.request, i18n.locales);
}

/** `Astro.preferredLocaleList`: every configured locale accepted by `Accept-Language`, in order. */
export function computePreferredLocaleList(state: FetchState): string[] | undefined {
	const { i18n } = state.manifest;
	if (!i18n) return;
	return computePreferredLocaleListUtil(state.request, i18n.locales);
}

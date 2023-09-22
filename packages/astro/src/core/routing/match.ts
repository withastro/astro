import type { AstroConfig, ManifestData, RouteData } from '../../@types/astro.js';

/** Find matching route from pathname */
export function matchRoute(pathname: string, manifest: ManifestData): RouteData | undefined {
	return manifest.routes.find((route) => route.pattern.test(decodeURI(pathname)));
}

/** Finds all matching routes from pathname */
export function matchAllRoutes(pathname: string, manifest: ManifestData): RouteData[] {
	return manifest.routes.filter((route) => route.pattern.test(pathname));
}

/**
 * Given a pathname, the function attempts to retrieve the one that belongs to the `defaultLocale`.
 *
 * For example, given this configuration:
 *
 * ```js
 * {
 * 	defaultLocale: 'en',
 * 	locales: ['en', 'fr']
 * }
 * ```
 *
 * If we don't have the page `/fr/hello`, this function will attempt to match against `/en/hello`.
 */
export function matchDefaultLocaleRoutes(
	pathname: string,
	manifest: ManifestData,
	config: AstroConfig
): RouteData[] {
	// SAFETY: the function is called upon checking if `experimental.i18n` exists first
	const i18n = config.experimental.i18n!;
	const base = config.base;

	const matchedRoutes: RouteData[] = [];
	const defaultLocale = i18n.defaultLocale;

	for (const route of manifest.routes) {
		// we don't need to check routes that don't belong to the default locale
		if (route.locale === defaultLocale) {
			// we check if the current route pathname contains `/en` somewhere
			if (
				route.pathname?.startsWith(`/${defaultLocale}`) ||
				route.pathname?.startsWith(`${base}/${defaultLocale}`)
			) {
				let localeToReplace;
				// now we need to check if the locale inside `pathname` is actually one of the locales configured
				for (const locale of i18n.locales) {
					if (pathname.startsWith(`${base}/${locale}`) || pathname.startsWith(`/${locale}`)) {
						localeToReplace = locale;
						break;
					}
				}
				if (localeToReplace) {
					// we attempt the replace the locale found with the default locale, and now we could if matches the current `route`
					const maybePathname = pathname.replace(localeToReplace, defaultLocale);
					if (route.pattern.test(maybePathname)) {
						matchedRoutes.push(route);
					}
				}
			}
		}
	}

	return matchedRoutes;
}

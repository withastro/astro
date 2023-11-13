import { appendForwardSlash, joinPaths } from '@astrojs/internal-helpers/path';
import type { MiddlewareEndpointHandler, RouteData, SSRManifest } from '../@types/astro.js';
import type { RouteInfo } from '../core/app/types.js';

// Checks if the pathname doesn't have any locale, exception for the defaultLocale, which is ignored on purpose
function checkIsLocaleFree(pathname: string, locales: string[]): boolean {
	for (const locale of locales) {
		if (pathname.includes(`/${locale}`)) {
			return false;
		}
	}

	return true;
}

export function createI18nMiddleware(
	i18n: SSRManifest['i18n'],
	base: SSRManifest['base'],
	trailingSlash: SSRManifest['trailingSlash'],
	routes: RouteData[]
): MiddlewareEndpointHandler | undefined {
	if (!i18n) {
		return undefined;
	}

	// we get all the routes that aren't pages
	const nonPagesRoutes = routes.filter((route) => {
		return route.type !== 'page';
	});

	return async (context, next) => {
		if (!i18n) {
			return await next();
		}

		const url = context.url;
		// We get the pathname
		// Internally, Astro removes the `base` from the manifest data of the routes.
		// We have to make sure that we remove it from the pathname of the request
		let astroPathname = url.pathname;
		if (astroPathname.startsWith(base) && base !== '/') {
			astroPathname = astroPathname.slice(base.length);
		}

		const { locales, defaultLocale, fallback } = i18n;

		const response = await next();

		if (response instanceof Response) {
			const separators = url.pathname.split('/');
			const pathnameContainsDefaultLocale = url.pathname.includes(`/${defaultLocale}`);
			const isLocaleFree = checkIsLocaleFree(url.pathname, i18n.locales);
			if (i18n.routingStrategy === 'prefix-other-locales' && pathnameContainsDefaultLocale) {
				const newLocation = url.pathname.replace(`/${defaultLocale}`, '');
				response.headers.set('Location', newLocation);
				return new Response(null, {
					status: 404,
					headers: response.headers,
				});
			} else if (i18n.routingStrategy === 'prefix-always') {
				// We want to do this check only here, because `prefix-other-locales` assumes that non localized folder are valid
				if (shouldSkipRoute(astroPathname, nonPagesRoutes, locales)) {
					return await next();
				}

				if (url.pathname === base + '/' || url.pathname === base) {
					if (trailingSlash === 'always') {
						return context.redirect(`${appendForwardSlash(joinPaths(base, i18n.defaultLocale))}`);
					} else {
						return context.redirect(`${joinPaths(base, i18n.defaultLocale)}`);
					}
				}

				// Astro can't know where the default locale is supposed to be, so it returns a 404 with no content.
				else if (isLocaleFree) {
					return new Response(null, {
						status: 404,
						headers: response.headers,
					});
				}
			}
			if (response.status >= 300 && fallback) {
				const fallbackKeys = i18n.fallback ? Object.keys(i18n.fallback) : [];

				const urlLocale = separators.find((s) => locales.includes(s));

				if (urlLocale && fallbackKeys.includes(urlLocale)) {
					const fallbackLocale = fallback[urlLocale];
					let newPathname: string;
					// If a locale falls back to the default locale, we want to **remove** the locale because
					// the default locale doesn't have a prefix
					if (fallbackLocale === defaultLocale) {
						newPathname = url.pathname.replace(`/${urlLocale}`, ``);
					} else {
						newPathname = url.pathname.replace(`/${urlLocale}`, `/${fallbackLocale}`);
					}

					return context.redirect(newPathname);
				}
			}
		}

		return response;
	};
}

/**
 * Checks whether a route should be skipped from the middleware logic. A route should be not be skipped when:
 * - it's the home
 * - it contains any locale
 * - the pathname belongs to a route that is not a page
 */
function shouldSkipRoute(pathname: string, pageRoutes: RouteData[], locales: string[]) {
	if (!pathname.length || pathname === '/') {
		return false;
	}

	if (locales.some((locale) => pathname.includes(`/${locale}`))) {
		return false;
	}

	return pageRoutes.some((route) => {
		return !route.pattern.test(pathname);
	});
}

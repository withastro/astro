import { appendForwardSlash, joinPaths } from '@astrojs/internal-helpers/path';
import type { MiddlewareEndpointHandler, SSRManifest } from '../@types/astro.js';
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

    routes: SSRManifest['routes']
): MiddlewareEndpointHandler | undefined {
	if (!i18n) {
		return undefined;
	}

	const pageRoutes = routes.filter((route) => {
		return route.routeData.type === 'page';
	});

	return async (context, next) => {
		if (!i18n) {
			return await next();
		}

		const url = context.url;
		if (!isPathnameARoutePage(pageRoutes, url.pathname)) {
			return await next();
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
 * Check whether the pathname of the current request belongs to a route of type page.
 * @param pageRoutes
 * @param pathname
 */
function isPathnameARoutePage(pageRoutes: RouteInfo[], pathname: string) {
	return pageRoutes.some((route) => {
		return route.routeData.route === pathname;
	});
}

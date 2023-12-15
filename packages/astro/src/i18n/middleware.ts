import { appendForwardSlash, joinPaths } from '@astrojs/internal-helpers/path';
import type { Locales, MiddlewareHandler, RouteData, SSRManifest } from '../@types/astro.js';
import type { PipelineHookFunction } from '../core/pipeline.js';
import { getPathByLocale, normalizeTheLocale } from './index.js';

const routeDataSymbol = Symbol.for('astro.routeData');

// Checks if the pathname has any locale, exception for the defaultLocale, which is ignored on purpose.
function pathnameHasLocale(pathname: string, locales: Locales): boolean {
	const segments = pathname.split('/');
	for (const segment of segments) {
		for (const locale of locales) {
			if (typeof locale === 'string') {
				if (normalizeTheLocale(segment) === normalizeTheLocale(locale)) {
					return true;
				}
			} else if (segment === locale.path) {
				return true;
			}
		}
	}

	return false;
}

export function createI18nMiddleware(
	i18n: SSRManifest['i18n'],
	base: SSRManifest['base'],
	trailingSlash: SSRManifest['trailingSlash']
): MiddlewareHandler | undefined {
	if (!i18n) {
		return undefined;
	}

	return async (context, next) => {
		if (!i18n) {
			return await next();
		}

		const routeData = Reflect.get(context.request, routeDataSymbol);
		if (routeData) {
			// If the route we're processing is not a page, then we ignore it
			if (
				(routeData as RouteData).type !== 'page' &&
				(routeData as RouteData).type !== 'fallback'
			) {
				return await next();
			}
		}

		const url = context.url;
		const { locales, defaultLocale, fallback, routing } = i18n;
		const response = await next();

		if (response instanceof Response) {
			const pathnameContainsDefaultLocale = url.pathname.includes(`/${defaultLocale}`);
			if (i18n.routing === 'prefix-other-locales' && pathnameContainsDefaultLocale) {
				const newLocation = url.pathname.replace(`/${defaultLocale}`, '');
				response.headers.set('Location', newLocation);
				return new Response(null, {
					status: 404,
					headers: response.headers,
				});
			} else if (i18n.routing === 'prefix-always') {
				if (url.pathname === base + '/' || url.pathname === base) {
					if (trailingSlash === 'always') {
						return context.redirect(`${appendForwardSlash(joinPaths(base, i18n.defaultLocale))}`);
					} else {
						return context.redirect(`${joinPaths(base, i18n.defaultLocale)}`);
					}
				}

				// Astro can't know where the default locale is supposed to be, so it returns a 404 with no content.
				else if (!pathnameHasLocale(url.pathname, i18n.locales)) {
					return new Response(null, {
						status: 404,
						headers: response.headers,
					});
				}
			}
			if (response.status >= 300 && fallback) {
				const fallbackKeys = i18n.fallback ? Object.keys(i18n.fallback) : [];

				// we split the URL using the `/`, and then check in the returned array we have the locale
				const segments = url.pathname.split('/');
				const urlLocale = segments.find((segment) => {
					for (const locale of locales) {
						if (typeof locale === 'string') {
							if (locale === segment) {
								return true;
							}
						} else if (locale.path === segment) {
							return true;
						}
					}
					return false;
				});

				if (urlLocale && fallbackKeys.includes(urlLocale)) {
					const fallbackLocale = fallback[urlLocale];
					// the user might have configured the locale using the granular locales, so we want to retrieve its corresponding path instead
					const pathFallbackLocale = getPathByLocale(fallbackLocale, locales);
					let newPathname: string;
					// If a locale falls back to the default locale, we want to **remove** the locale because
					// the default locale doesn't have a prefix
					if (pathFallbackLocale === defaultLocale && routing === 'prefix-other-locales') {
						newPathname = url.pathname.replace(`/${urlLocale}`, ``);
					} else {
						newPathname = url.pathname.replace(`/${urlLocale}`, `/${pathFallbackLocale}`);
					}

					return context.redirect(newPathname);
				}
			}
		}

		return response;
	};
}

/**
 * This pipeline hook attaches a `RouteData` object to the `Request`
 */
export const i18nPipelineHook: PipelineHookFunction = (ctx) => {
	Reflect.set(ctx.request, routeDataSymbol, ctx.route);
};

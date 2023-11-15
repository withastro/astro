import { appendForwardSlash, joinPaths } from '@astrojs/internal-helpers/path';
import type { MiddlewareEndpointHandler, RouteData, SSRManifest } from '../@types/astro.js';
import type { RouteInfo } from '../core/app/types.js';
import type { PipelineHookFunction } from '../core/pipeline.js';

const routeDataSymbol = Symbol.for('astro.routeData');

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
	trailingSlash: SSRManifest['trailingSlash']
): MiddlewareEndpointHandler | undefined {
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
 * This pipeline hook attaches a `RouteData` object to the `Request`
 */
export const i18nPipelineHook: PipelineHookFunction = (ctx) => {
	Reflect.set(ctx.request, routeDataSymbol, ctx.route);
};

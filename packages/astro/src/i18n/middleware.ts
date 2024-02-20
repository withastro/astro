import type { APIContext, MiddlewareHandler, RouteData, SSRManifest } from '../@types/astro.js';
import type { PipelineHookFunction } from '../core/pipeline.js';
import {
	getPathByLocale,
	type MiddlewarePayload,
	normalizeTheLocale,
	pathHasLocale,
	redirectToDefaultLocale,
	noFoundForNonLocaleRoute,
} from './index.js';
import { ROUTE_DATA_SYMBOL } from '../core/constants.js';
import type { SSRManifestI18n } from '../core/app/types.js';

const routeDataSymbol = Symbol.for(ROUTE_DATA_SYMBOL);

export function createI18nMiddleware(
	i18n: SSRManifest['i18n'],
	base: SSRManifest['base'],
	trailingSlash: SSRManifest['trailingSlash'],
	format: SSRManifest['buildFormat']
): MiddlewareHandler {
	if (!i18n) return (_, next) => next();
	const payload: MiddlewarePayload = {
		...i18n,
		trailingSlash,
		base,
		format,
		domains: {},
	};

	const _redirectToDefaultLocale = redirectToDefaultLocale(payload);
	const _noFoundForNonLocaleRoute = noFoundForNonLocaleRoute(payload);

	const prefixAlways = (
		url: URL,
		response: Response,
		context: APIContext
	): Response | undefined => {
		if (url.pathname === base + '/' || url.pathname === base) {
			return _redirectToDefaultLocale(context);
		}

		// Astro can't know where the default locale is supposed to be, so it returns a 404 with no content.
		else if (!pathHasLocale(url.pathname, i18n.locales)) {
			return new Response(null, {
				status: 404,
				headers: response.headers,
			});
		}

		return undefined;
	};

	const prefixOtherLocales = (url: URL, response: Response): Response | undefined => {
		let pathnameContainsDefaultLocale = false;
		for (const segment of url.pathname.split('/')) {
			if (normalizeTheLocale(segment) === normalizeTheLocale(i18n.defaultLocale)) {
				pathnameContainsDefaultLocale = true;
				break;
			}
		}
		if (pathnameContainsDefaultLocale) {
			const newLocation = url.pathname.replace(`/${i18n.defaultLocale}`, '');
			response.headers.set('Location', newLocation);
			return new Response(null, {
				status: 404,
				headers: response.headers,
			});
		}

		return undefined;
	};

	return async (context, next) => {
		const routeData: RouteData | undefined = Reflect.get(context.request, routeDataSymbol);
		// If the route we're processing is not a page, then we ignore it
		if (routeData?.type !== 'page' && routeData?.type !== 'fallback') {
			return await next();
		}
		const currentLocale = context.currentLocale;

		const url = context.url;
		const { locales, defaultLocale, fallback, strategy } = i18n;
		const response = await next();

		if (response instanceof Response) {
			switch (i18n.strategy) {
				case 'domains-prefix-other-locales': {
					if (localeHasntDomain(i18n, currentLocale)) {
						const result = prefixOtherLocales(url, response);
						if (result) {
							return result;
						}
					}
					break;
				}
				case 'pathname-prefix-other-locales': {
					const result = prefixOtherLocales(url, response);
					if (result) {
						return result;
					}
					break;
				}

				case 'domains-prefix-always-no-redirect': {
					if (localeHasntDomain(i18n, currentLocale)) {
						const result = _noFoundForNonLocaleRoute(context, response);
						if (result) {
							return result;
						}
					}
					break;
				}

				case 'pathname-prefix-always-no-redirect': {
					const result = _noFoundForNonLocaleRoute(context, response);
					if (result) {
						return result;
					}
					break;
				}

				case 'pathname-prefix-always': {
					const result = prefixAlways(url, response, context);
					if (result) {
						return result;
					}
					break;
				}
				case 'domains-prefix-always': {
					if (localeHasntDomain(i18n, currentLocale)) {
						const result = prefixAlways(url, response, context);
						if (result) {
							return result;
						}
					}
					break;
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
					if (
						pathFallbackLocale === defaultLocale &&
						strategy === 'pathname-prefix-other-locales'
					) {
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

/**
 * Checks if the current locale doesn't belong to a configured domain
 * @param i18n
 * @param currentLocale
 */
function localeHasntDomain(i18n: SSRManifestI18n, currentLocale: string | undefined) {
	for (const domainLocale of Object.values(i18n.domainLookupTable)) {
		if (domainLocale === currentLocale) {
			return false;
		}
	}
	return true;
}

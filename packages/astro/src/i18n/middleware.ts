import { appendForwardSlash, joinPaths } from '@astrojs/internal-helpers/path';
import type { APIContext, Locales, MiddlewareHandler, SSRManifest } from '../@types/astro.js';
import type { SSRManifestI18n } from '../core/app/types.js';
import { shouldAppendForwardSlash } from '../core/build/util.js';
import { REROUTE_DIRECTIVE_HEADER, ROUTE_TYPE_HEADER } from '../core/constants.js';
import { getPathByLocale, normalizeTheLocale } from './index.js';

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
	trailingSlash: SSRManifest['trailingSlash'],
	buildFormat: SSRManifest['buildFormat']
): MiddlewareHandler {
	if (!i18n) return (_, next) => next();

	const prefixAlways = (
		url: URL,
		response: Response,
		context: APIContext
	): Response | undefined => {
		if (url.pathname === base + '/' || url.pathname === base) {
			if (shouldAppendForwardSlash(trailingSlash, buildFormat)) {
				return context.redirect(`${appendForwardSlash(joinPaths(base, i18n.defaultLocale))}`);
			} else {
				return context.redirect(`${joinPaths(base, i18n.defaultLocale)}`);
			}
		}

		// Astro can't know where the default locale is supposed to be, so it returns a 404.
		else if (!pathnameHasLocale(url.pathname, i18n.locales)) {
			return notFound(response);
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
			return notFound(response);
		}

		return undefined;
	};

	/**
	 * We return a 404 if:
	 * - the current path isn't a root. e.g. / or /<base>
	 * - the URL doesn't contain a locale
	 * @param url
	 * @param response
	 */
	const prefixAlwaysNoRedirect = (url: URL, response: Response): Response | undefined => {
		// We return a 404 if:
		// - the current path isn't a root. e.g. / or /<base>
		// - the URL doesn't contain a locale
		const isRoot = url.pathname === base + '/' || url.pathname === base;
		if (!(isRoot || pathnameHasLocale(url.pathname, i18n.locales))) {
			return notFound(response);
		}

		return undefined;
	};

	return async (context, next) => {
		const response = await next();
		const type = response.headers.get(ROUTE_TYPE_HEADER);
		// If the route we're processing is not a page, then we ignore it
		if (type !== 'page' && type !== 'fallback') {
			return response;
		}

		const { url, currentLocale } = context;
		const { locales, defaultLocale, fallback, strategy } = i18n;

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
					const result = prefixAlwaysNoRedirect(url, response);
					if (result) {
						return result;
					}
				}
				break;
			}

			case 'pathname-prefix-always-no-redirect': {
				const result = prefixAlwaysNoRedirect(url, response);
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
				if (pathFallbackLocale === defaultLocale && strategy === 'pathname-prefix-other-locales') {
					newPathname = url.pathname.replace(`/${urlLocale}`, ``);
				} else {
					newPathname = url.pathname.replace(`/${urlLocale}`, `/${pathFallbackLocale}`);
				}

				return context.redirect(newPathname);
			}
		}

		return response;
	};
}

/**
 * The i18n returns empty 404 responses in certain cases.
 * Error-page-rerouting infra will attempt to render the 404.astro page, causing the middleware to run a second time.
 * To avoid loops and overwriting the contents of `404.astro`, we allow error pages to pass through.
 */
function notFound(response: Response) {
	if (response.headers.get(REROUTE_DIRECTIVE_HEADER) === 'no') return response;
	return new Response(null, {
		status: 404,
		headers: response.headers,
	});
}

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

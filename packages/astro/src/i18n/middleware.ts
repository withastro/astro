import type { MiddlewareEndpointHandler } from '../@types/astro.js';
import type { SSRManifest } from '../@types/astro.js';
import type { Environment } from '../core/render/index.js';

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
	i18n: SSRManifest['i18n']
): MiddlewareEndpointHandler | undefined {
	if (!i18n) {
		return undefined;
	}
	const locales = i18n.locales;

	return async (context, next) => {
		if (!i18n) {
			return await next();
		}
		const response = await next();

		const url = context.url;
		if (response instanceof Response) {
			const separators = url.pathname.split('/');
			const pathnameContainsDefaultLocale = url.pathname.includes(`/${i18n.defaultLocale}`);
			const isLocaleFree = checkIsLocaleFree(url.pathname, i18n.locales);
			if (i18n.routingStrategy === 'prefix-other-locales' && pathnameContainsDefaultLocale) {
				const content = await response.text();
				const newLocation = url.pathname.replace(`/${i18n.defaultLocale}`, '');
				response.headers.set('Location', newLocation);
				return new Response(content, {
					status: 302,
					headers: response.headers,
				});
			}
			// Astro can't know where the default locale is supposed to be, so it returns a 404 with no content.
			// TODO: decide what's the best approach in another PR. With `prefix-always` all routes should have the locale unless opt-out (this is for later).
			// TODO: What's best? 404 or hard error?
			else if (i18n.routingStrategy === 'prefix-always' && isLocaleFree) {
				return new Response(null, {
					status: 404,
					headers: response.headers,
				});
			}
			if (response.status >= 300 && i18n.fallback) {
				const fallbackKeys = i18n.fallback ? Object.keys(i18n.fallback) : [];

				const urlLocale = separators.find((s) => locales.includes(s));

				if (urlLocale && fallbackKeys.includes(urlLocale)) {
					const fallbackLocale = i18n.fallback[urlLocale];
					let newPathname: string;
					// If a locale falls back to the default locale, we want to **remove** the locale because
					// the default locale doesn't have a prefix
					if (fallbackLocale === i18n.defaultLocale) {
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

import type { MiddlewareEndpointHandler } from '../@types/astro.js';
import type { SSRManifest } from '../@types/astro.js';

export function createI18nMiddleware(
	i18n: SSRManifest['i18n']
): MiddlewareEndpointHandler | undefined {
	if (!i18n) {
		return undefined;
	}
	const locales = i18n.locales;

	return async (context, next) => {
		if (!i18n.fallback) {
			return await next();
		}
		const response = await next();

		const url = context.url;
		if (response instanceof Response) {
			const separators = url.pathname.split('/');
			const fallbackWithRedirect = i18n.fallbackControl === 'redirect';
			if (fallbackWithRedirect && url.pathname.includes(`/${i18n.defaultLocale}`)) {
				const content = await response.text();
				const newLocation = url.pathname.replace(`/${i18n.defaultLocale}`, '');
				response.headers.set('Location', newLocation);
				return new Response(content, {
					status: 302,
					headers: response.headers,
				});
			}
			if (fallbackWithRedirect && response.status >= 300) {
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

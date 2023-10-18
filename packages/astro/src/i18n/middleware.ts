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
			return next();
		}

		const response = await next();
		if (i18n.fallbackControl === 'redirect' && response instanceof Response) {
			const fallbackKeys = i18n.fallback ? Object.keys(i18n.fallback) : [];
			const url = context.url;
			const separators = url.pathname.split('/');

			const urlLocale = separators.find((s) => locales.includes(s));

			if (urlLocale && fallbackKeys.includes(urlLocale)) {
				const fallbackLocale = i18n.fallback[urlLocale];
				const newPathname = url.pathname.replace(`/${urlLocale}`, `/${fallbackLocale}`);
				return context.redirect(newPathname);
			}
		}

		return response;
	};
}

import type { AstroConfig, MiddlewareEndpointHandler } from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';

export function createI18nMiddleware(
	config: Readonly<AstroConfig>,
	logger: Logger
): MiddlewareEndpointHandler | undefined {
	const i18n = config.experimental?.i18n;
	if (!i18n) {
		return undefined;
	}
	const fallbackKeys = Object.keys(i18n.fallback);
	const locales = i18n.locales;

	logger.debug('i18n', 'Successfully created middleware');
	return async (context, next) => {
		if (fallbackKeys.length <= 0) {
			return next();
		}

		const response = await next();
		if (i18n.fallbackControl === 'redirect' && response instanceof Response) {
			const url = context.url;
			const separators = url.pathname.split('/');

			const urlLocale = separators.find((s) => locales.includes(s));

			if (urlLocale && fallbackKeys.includes(urlLocale)) {
				// TODO: correctly handle chain of fallback
				const fallbackLocale = i18n.fallback[urlLocale][0];
				const newPathname = url.pathname.replace(`/${urlLocale}`, `/${fallbackLocale}`);
				return context.redirect(newPathname);
			}
		}

		return response;
	};
}

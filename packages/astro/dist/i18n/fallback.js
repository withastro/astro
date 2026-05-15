import { getPathByLocale } from './index.js';
function computeFallbackRoute(options) {
	const {
		pathname,
		responseStatus,
		fallback,
		fallbackType,
		locales,
		defaultLocale,
		strategy,
		base,
	} = options;
	if (responseStatus !== 404) {
		return { type: 'none' };
	}
	if (!fallback || Object.keys(fallback).length === 0) {
		return { type: 'none' };
	}
	const segments = pathname.split('/');
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
	if (!urlLocale) {
		return { type: 'none' };
	}
	const fallbackKeys = Object.keys(fallback);
	if (!fallbackKeys.includes(urlLocale)) {
		return { type: 'none' };
	}
	const fallbackLocale = fallback[urlLocale];
	const pathFallbackLocale = getPathByLocale(fallbackLocale, locales);
	let newPathname;
	if (pathFallbackLocale === defaultLocale && strategy === 'pathname-prefix-other-locales') {
		if (pathname.includes(`${base}`)) {
			newPathname = pathname.replace(`/${urlLocale}`, ``);
		} else {
			newPathname = pathname.replace(`/${urlLocale}`, `/`);
		}
	} else {
		newPathname = pathname.replace(`/${urlLocale}`, `/${pathFallbackLocale}`);
	}
	return {
		type: fallbackType,
		pathname: newPathname,
	};
}
export { computeFallbackRoute };

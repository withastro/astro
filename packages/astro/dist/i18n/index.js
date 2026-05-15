import { appendForwardSlash, joinPaths } from '@astrojs/internal-helpers/path';
import { shouldAppendForwardSlash } from '../core/build/util.js';
import { REROUTE_DIRECTIVE_HEADER } from '../core/constants.js';
import { i18nNoLocaleFoundInPath, MissingLocale } from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/index.js';
import { createI18nMiddleware } from './middleware.js';
function requestHasLocale(locales) {
	return function (context) {
		return pathHasLocale(context.url.pathname, locales);
	};
}
function pathHasLocale(path, locales) {
	const segments = path.split('/').map(normalizeThePath);
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
function getLocaleRelativeUrl({
	locale,
	base,
	locales: _locales,
	trailingSlash,
	format,
	path,
	prependWith,
	normalizeLocale = true,
	strategy = 'pathname-prefix-other-locales',
	defaultLocale,
}) {
	const codeToUse = peekCodePathToUse(_locales, locale);
	if (!codeToUse) {
		throw new AstroError({
			...MissingLocale,
			message: MissingLocale.message(locale),
		});
	}
	const pathsToJoin = [base, prependWith];
	const normalizedLocale = normalizeLocale ? normalizeTheLocale(codeToUse) : codeToUse;
	if (
		strategy === 'pathname-prefix-always' ||
		strategy === 'pathname-prefix-always-no-redirect' ||
		strategy === 'domains-prefix-always' ||
		strategy === 'domains-prefix-always-no-redirect'
	) {
		pathsToJoin.push(normalizedLocale);
	} else if (locale !== defaultLocale) {
		pathsToJoin.push(normalizedLocale);
	}
	pathsToJoin.push(path);
	let relativePath;
	if (shouldAppendForwardSlash(trailingSlash, format)) {
		relativePath = appendForwardSlash(joinPaths(...pathsToJoin));
	} else {
		relativePath = joinPaths(...pathsToJoin);
	}
	if (relativePath === '') {
		return '/';
	}
	return relativePath;
}
function getLocaleAbsoluteUrl({ site, isBuild, ...rest }) {
	const localeUrl = getLocaleRelativeUrl(rest);
	const { domains, locale } = rest;
	let url;
	if (isBuild && domains && domains[locale]) {
		const base = domains[locale];
		url = joinPaths(base, localeUrl.replace(`/${rest.locale}`, ''));
	} else {
		if (localeUrl === '/') {
			url = site || '/';
		} else if (site) {
			url = joinPaths(site, localeUrl);
		} else {
			url = localeUrl;
		}
	}
	if (shouldAppendForwardSlash(rest.trailingSlash, rest.format)) {
		return appendForwardSlash(url);
	} else {
		return url;
	}
}
function getLocaleRelativeUrlList({ locales: _locales, ...rest }) {
	const locales = toPaths(_locales);
	return locales.map((locale) => {
		return getLocaleRelativeUrl({ ...rest, locales, locale });
	});
}
function getLocaleAbsoluteUrlList(params) {
	const locales = toCodes(params.locales);
	return locales.map((currentLocale) => {
		return getLocaleAbsoluteUrl({ ...params, locale: currentLocale });
	});
}
function getPathByLocale(locale, locales) {
	for (const loopLocale of locales) {
		if (typeof loopLocale === 'string') {
			if (loopLocale === locale) {
				return loopLocale;
			}
		} else {
			for (const code of loopLocale.codes) {
				if (code === locale) {
					return loopLocale.path;
				}
			}
		}
	}
	throw new AstroError(i18nNoLocaleFoundInPath);
}
function getLocaleByPath(path, locales) {
	for (const locale of locales) {
		if (typeof locale !== 'string') {
			if (locale.path === path) {
				const code = locale.codes.at(0);
				if (code === void 0) throw new AstroError(i18nNoLocaleFoundInPath);
				return code;
			}
		} else if (locale === path) {
			return locale;
		}
	}
	throw new AstroError(i18nNoLocaleFoundInPath);
}
function normalizeTheLocale(locale) {
	return locale.replaceAll('_', '-').toLowerCase();
}
function normalizeThePath(path) {
	return path.endsWith('.html') ? path.slice(0, -5) : path;
}
function getAllCodes(locales) {
	const result = [];
	for (const loopLocale of locales) {
		if (typeof loopLocale === 'string') {
			result.push(loopLocale);
		} else {
			result.push(...loopLocale.codes);
		}
	}
	return result;
}
function toCodes(locales) {
	return locales.map((loopLocale) => {
		if (typeof loopLocale === 'string') {
			return loopLocale;
		} else {
			return loopLocale.codes[0];
		}
	});
}
function toPaths(locales) {
	return locales.map((loopLocale) => {
		if (typeof loopLocale === 'string') {
			return loopLocale;
		} else {
			return loopLocale.path;
		}
	});
}
function peekCodePathToUse(locales, locale) {
	for (const loopLocale of locales) {
		if (typeof loopLocale === 'string') {
			if (loopLocale === locale) {
				return loopLocale;
			}
		} else {
			for (const code of loopLocale.codes) {
				if (code === locale) {
					return loopLocale.path;
				}
			}
		}
	}
	return void 0;
}
function redirectToDefaultLocale({ trailingSlash, format, base, defaultLocale }) {
	return function (context, statusCode) {
		if (shouldAppendForwardSlash(trailingSlash, format)) {
			return context.redirect(`${appendForwardSlash(joinPaths(base, defaultLocale))}`, statusCode);
		} else {
			return context.redirect(`${joinPaths(base, defaultLocale)}`, statusCode);
		}
	};
}
function notFound({ base, locales, fallback }) {
	return function (context, response) {
		if (
			response?.headers.get(REROUTE_DIRECTIVE_HEADER) === 'no' &&
			typeof fallback === 'undefined'
		) {
			return response;
		}
		const url = context.url;
		const isRoot = url.pathname === base + '/' || url.pathname === base;
		if (!(isRoot || pathHasLocale(url.pathname, locales))) {
			if (response) {
				response.headers.set(REROUTE_DIRECTIVE_HEADER, 'no');
				return new Response(response.body, {
					status: 404,
					headers: response.headers,
				});
			} else {
				return new Response(null, {
					status: 404,
					headers: {
						[REROUTE_DIRECTIVE_HEADER]: 'no',
					},
				});
			}
		}
		return void 0;
	};
}
function redirectToFallback({ fallback, locales, defaultLocale, strategy, base, fallbackType }) {
	return async function (context, response) {
		if (response.status === 404 && fallback) {
			const fallbackKeys = fallback ? Object.keys(fallback) : [];
			const segments = context.url.pathname.split('/');
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
				const pathFallbackLocale = getPathByLocale(fallbackLocale, locales);
				let newPathname;
				if (pathFallbackLocale === defaultLocale && strategy === 'pathname-prefix-other-locales') {
					if (context.url.pathname.includes(`${base}`)) {
						newPathname = context.url.pathname.replace(`/${urlLocale}`, ``);
					} else {
						newPathname = context.url.pathname.replace(`/${urlLocale}`, `/`);
					}
				} else {
					newPathname = context.url.pathname.replace(`/${urlLocale}`, `/${pathFallbackLocale}`);
				}
				if (fallbackType === 'rewrite') {
					return await context.rewrite(newPathname + context.url.search);
				} else {
					return context.redirect(newPathname + context.url.search);
				}
			}
		}
		return response;
	};
}
function createMiddleware(i18nManifest, base, trailingSlash, format) {
	return createI18nMiddleware(i18nManifest, base, trailingSlash, format);
}
export {
	createMiddleware,
	getAllCodes,
	getLocaleAbsoluteUrl,
	getLocaleAbsoluteUrlList,
	getLocaleByPath,
	getLocaleRelativeUrl,
	getLocaleRelativeUrlList,
	getPathByLocale,
	normalizeTheLocale,
	normalizeThePath,
	notFound,
	pathHasLocale,
	redirectToDefaultLocale,
	redirectToFallback,
	requestHasLocale,
	toCodes,
	toPaths,
};

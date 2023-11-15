import { appendForwardSlash, joinPaths } from '@astrojs/internal-helpers/path';
import type { AstroConfig } from '../@types/astro.js';
import { shouldAppendForwardSlash } from '../core/build/util.js';
import { MissingLocale } from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/index.js';

type GetLocaleRelativeUrl = GetLocaleOptions & {
	locale: string;
	base: string;
	locales: string[];
	trailingSlash: AstroConfig['trailingSlash'];
	format: AstroConfig['build']['format'];
	routingStrategy?: 'prefix-always' | 'prefix-other-locales';
	defaultLocale: string;
	domains: Record<string, string>;
	path: string;
};

export type GetLocaleOptions = {
	/**
	 * Makes the locale URL-friendly by replacing underscores with dashes, and converting the locale to lower case.
	 * @default true
	 */
	normalizeLocale?: boolean;
	/**
	 *  An optional path to prepend to `locale`.
	 */
	prependWith?: string;
};

type GetLocaleAbsoluteUrl = GetLocaleRelativeUrl & {
	site: AstroConfig['site'];
	isBuild: boolean;
};
/**
 * The base URL
 */
export function getLocaleRelativeUrl({
	locale,
	base,
	locales,
	trailingSlash,
	format,
	path,
	prependWith,
	normalizeLocale = true,
	routingStrategy = 'prefix-other-locales',
	defaultLocale,
}: GetLocaleRelativeUrl) {
	if (!locales.includes(locale)) {
		throw new AstroError({
			...MissingLocale,
			message: MissingLocale.message(locale, locales),
		});
	}
	const pathsToJoin = [base, prependWith];
	const normalizedLocale = normalizeLocale ? normalizeTheLocale(locale) : locale;
	if (routingStrategy === 'prefix-always') {
		pathsToJoin.push(normalizedLocale);
	} else if (locale !== defaultLocale) {
		pathsToJoin.push(normalizedLocale);
	}
	pathsToJoin.push(path);

	if (shouldAppendForwardSlash(trailingSlash, format)) {
		return appendForwardSlash(joinPaths(...pathsToJoin));
	} else {
		return joinPaths(...pathsToJoin);
	}
}

/**
 * The absolute URL
 */
export function getLocaleAbsoluteUrl({ site, isBuild, ...rest }: GetLocaleAbsoluteUrl) {
	const localeUrl = getLocaleRelativeUrl(rest);
	const { domains, locale } = rest;
	let url;
	if (isBuild) {
		const base = domains[locale];
		url = joinPaths(base, localeUrl.replace(`/${rest.locale}`, ''));
	} else {
		if (site) {
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

type GetLocalesBaseUrl = GetLocaleOptions & {
	base: string;
	path: string;
	locales: string[];
	trailingSlash: AstroConfig['trailingSlash'];
	format: AstroConfig['build']['format'];
	routingStrategy?: 'prefix-always' | 'prefix-other-locales';
	defaultLocale: string;
};

export function getLocaleRelativeUrlList({
	base,
	locales,
	trailingSlash,
	format,
	path,
	prependWith,
	normalizeLocale = true,
	routingStrategy = 'prefix-other-locales',
	defaultLocale,
}: GetLocalesBaseUrl) {
	return locales.map((locale) => {
		const pathsToJoin = [base, prependWith];
		const normalizedLocale = normalizeLocale ? normalizeTheLocale(locale) : locale;

		if (routingStrategy === 'prefix-always') {
			pathsToJoin.push(normalizedLocale);
		} else if (locale !== defaultLocale) {
			pathsToJoin.push(normalizedLocale);
		}
		pathsToJoin.push(path);
		if (shouldAppendForwardSlash(trailingSlash, format)) {
			return appendForwardSlash(joinPaths(...pathsToJoin));
		} else {
			return joinPaths(...pathsToJoin);
		}
	});
}

export function getLocaleAbsoluteUrlList({
	base,
	locales,
	trailingSlash,
	format,
	path,
	prependWith,
	normalizeLocale = true,
	routingStrategy = 'prefix-other-locales',
	defaultLocale,
	isBuild,
	domains,
	site,
}: GetLocaleAbsoluteUrl) {
	return locales.map((currentLocale) => {
		const pathsToJoin = [];
		const normalizedLocale = normalizeLocale ? normalizeTheLocale(currentLocale) : currentLocale;
		const domainBase = domains ? domains[currentLocale] : undefined;
		if (isBuild && domainBase) {
			if (domainBase) {
				pathsToJoin.push(domains[currentLocale]);
			} else {
				pathsToJoin.push(site);
			}
			pathsToJoin.push(base);
			pathsToJoin.push(prependWith);
		} else {
			if (site) {
				pathsToJoin.push(site);
			}
			pathsToJoin.push(base);
			pathsToJoin.push(prependWith);
			if (routingStrategy === 'prefix-always') {
				pathsToJoin.push(normalizedLocale);
			} else if (currentLocale !== defaultLocale) {
				pathsToJoin.push(normalizedLocale);
			}
		}

		pathsToJoin.push(path);
		if (shouldAppendForwardSlash(trailingSlash, format)) {
			return appendForwardSlash(joinPaths(...pathsToJoin));
		} else {
			return joinPaths(...pathsToJoin);
		}
	});
}

/**
 *
 * Given a locale, this function:
 * - replaces the `_` with a `-`;
 * - transforms all letters to be lower case;
 */
export function normalizeTheLocale(locale: string): string {
	return locale.replaceAll('_', '-').toLowerCase();
}

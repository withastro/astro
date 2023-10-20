import { AstroError } from '../core/errors/index.js';
import { MissingLocale } from '../core/errors/errors-data.js';
import { shouldAppendForwardSlash } from '../core/build/util.js';
import type { AstroConfig } from '../@types/astro.js';
import { joinPaths } from '@astrojs/internal-helpers/path';

type GetLocaleRelativeUrl = {
	locale: string;
	base: string;
	locales: string[];
	trailingSlash: AstroConfig['trailingSlash'];
	format: AstroConfig['build']['format'];
};

type GetLocaleAbsoluteUrl = GetLocaleRelativeUrl & {
	site: AstroConfig['site'];
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
}: GetLocaleRelativeUrl) {
	if (!locales.includes(locale)) {
		throw new AstroError({
			...MissingLocale,
			message: MissingLocale.message(locale, locales),
		});
	}

	const normalizedLocale = normalizeLocale(locale);
	if (shouldAppendForwardSlash(trailingSlash, format)) {
		return `${base}${normalizedLocale}/`;
	} else {
		return `${base}/${normalizedLocale}`;
	}
}

/**
 * The absolute URL
 */
export function getLocaleAbsoluteUrl({ site, ...rest }: GetLocaleAbsoluteUrl) {
	const locale = getLocaleRelativeUrl(rest);
	if (site) {
		return joinPaths(site, locale);
	} else {
		return locale;
	}
}

type GetLocalesBaseUrl = {
	base: string;
	locales: string[];
	trailingSlash: AstroConfig['trailingSlash'];
	format: AstroConfig['build']['format'];
};

export function getLocaleRelativeUrlList({
	base,
	locales,
	trailingSlash,
	format,
}: GetLocalesBaseUrl) {
	return locales.map((locale) => {
		const normalizedLocale = normalizeLocale(locale);
		if (shouldAppendForwardSlash(trailingSlash, format)) {
			return `${base}${normalizedLocale}/`;
		} else {
			return `${base}/${normalizedLocale}`;
		}
	});
}

export function getLocaleAbsoluteUrlList({ site, ...rest }: GetLocaleAbsoluteUrl) {
	const locales = getLocaleRelativeUrlList(rest);
	return locales.map((locale) => {
		if (site) {
			return joinPaths(site, locale);
		} else {
			return locale;
		}
	});
}

/**
 *
 * Given a locale, this function:
 * - replaces the `_` with a `-`;
 * - transforms all letters to be lower case;
 */
function normalizeLocale(locale: string): string {
	return locale.replaceAll('_', '-').toLowerCase();
}

import { AstroError } from '../core/errors/index.js';
import { MissingLocale } from '../core/errors/errors-data.js';
import { shouldAppendForwardSlash } from '../core/build/util.js';
import type { AstroConfig } from '../@types/astro.js';
import { appendForwardSlash, joinPaths } from '@astrojs/internal-helpers/path';

type GetLocaleRelativeUrl = GetLocaleOptions & {
	locale: string;
	base: string;
	locales: string[];
	trailingSlash: AstroConfig['trailingSlash'];
	format: AstroConfig['build']['format'];
};

export type GetLocaleOptions = {
	/**
	 * It makes the locale URL-friendly by replacing underscores with dashes, and making the locale lower case.
	 */
	normalizeLocale?: boolean;
	/**
	 * An optional path to add after the `locale`
	 */
	path?: string;
	/**
	 *  An optional path to prepend to `locale`
	 */
	prependWith?: string;
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
	path,
	prependWith,
	normalizeLocale = false,
}: GetLocaleRelativeUrl) {
	if (!locales.includes(locale)) {
		throw new AstroError({
			...MissingLocale,
			message: MissingLocale.message(locale, locales),
		});
	}

	const normalizedLocale = normalizeTheLocale(locale, normalizeLocale);
	if (shouldAppendForwardSlash(trailingSlash, format)) {
		return appendForwardSlash(joinPaths(base, prependWith, normalizedLocale, path));
	} else {
		return joinPaths(base, prependWith, normalizedLocale, path);
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

type GetLocalesBaseUrl = GetLocaleOptions & {
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
	path,
	prependWith,
	normalizeLocale = false,
}: GetLocalesBaseUrl) {
	return locales.map((locale) => {
		const normalizedLocale = normalizeTheLocale(locale, normalizeLocale);
		if (shouldAppendForwardSlash(trailingSlash, format)) {
			return appendForwardSlash(joinPaths(base, prependWith, normalizedLocale, path));
		} else {
			return joinPaths(base, prependWith, normalizedLocale, path);
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
function normalizeTheLocale(locale: string, shouldNormalize: boolean): string {
	if (!shouldNormalize) {
		return locale;
	}
	return locale.replaceAll('_', '-').toLowerCase();
}

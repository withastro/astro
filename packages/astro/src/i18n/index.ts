import { AstroError } from '../core/errors/index.js';
import { MissingLocale } from '../core/errors/errors-data.js';
import { shouldAppendForwardSlash } from '../core/build/util.js';
import type { AstroConfig } from '../@types/astro.js';

type GetI18nBaseUrl = {
	locale: string;
	base: string;
	locales: string[];
	trailingSlash: AstroConfig['trailingSlash'];
	format: AstroConfig['build']['format'];
};
/**
 * The base URL
 */
export function getI18nBaseUrl({ locale, base, locales, trailingSlash, format }: GetI18nBaseUrl) {
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

type GetLocalesBaseUrl = {
	base: string;
	locales: string[];
	trailingSlash: AstroConfig['trailingSlash'];
	format: AstroConfig['build']['format'];
};

export function getLocalesBaseUrl({ base, locales, trailingSlash, format }: GetLocalesBaseUrl) {
	return locales.map((locale) => {
		const normalizedLocale = normalizeLocale(locale);
		if (shouldAppendForwardSlash(trailingSlash, format)) {
			return `${base}${normalizedLocale}/`;
		} else {
			return `${base}/${normalizedLocale}`;
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

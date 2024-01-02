import { appendForwardSlash, joinPaths } from '@astrojs/internal-helpers/path';
import type { AstroConfig, Locales } from '../@types/astro.js';
import { shouldAppendForwardSlash } from '../core/build/util.js';
import { MissingLocale } from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/index.js';

type GetLocaleRelativeUrl = GetLocaleOptions & {
	locale: string;
	base: string;
	locales: Locales;
	trailingSlash: AstroConfig['trailingSlash'];
	format: AstroConfig['build']['format'];
	routing?: 'prefix-always' | 'prefix-other-locales';
	defaultLocale: string;
};

export type GetLocaleOptions = {
	/**
	 * Makes the locale URL-friendly by replacing underscores with dashes, and converting the locale to lower case.
	 * @default true
	 */
	normalizeLocale?: boolean;
	/**
	 * An optional path to add after the `locale`.
	 */
	path?: string;
	/**
	 *  An optional path to prepend to `locale`.
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
	locales: _locales,
	trailingSlash,
	format,
	path,
	prependWith,
	normalizeLocale = true,
	routing = 'prefix-other-locales',
	defaultLocale,
}: GetLocaleRelativeUrl) {
	const codeToUse = peekCodePathToUse(_locales, locale);
	if (!codeToUse) {
		throw new AstroError({
			...MissingLocale,
			message: MissingLocale.message(locale),
		});
	}
	const pathsToJoin = [base, prependWith];
	const normalizedLocale = normalizeLocale ? normalizeTheLocale(codeToUse) : codeToUse;
	if (routing === 'prefix-always') {
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
	locales: Locales;
	trailingSlash: AstroConfig['trailingSlash'];
	format: AstroConfig['build']['format'];
	routing?: 'prefix-always' | 'prefix-other-locales';
	defaultLocale: string;
};

export function getLocaleRelativeUrlList({
	base,
	locales: _locales,
	trailingSlash,
	format,
	path,
	prependWith,
	normalizeLocale = false,
	routing = 'prefix-other-locales',
	defaultLocale,
}: GetLocalesBaseUrl) {
	const locales = toPaths(_locales);
	return locales.map((locale) => {
		const pathsToJoin = [base, prependWith];
		const normalizedLocale = normalizeLocale ? normalizeTheLocale(locale) : locale;

		if (routing === 'prefix-always') {
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
 * Given a locale (code), it returns its corresponding path
 * @param locale
 * @param locales
 */
export function getPathByLocale(locale: string, locales: Locales) {
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
}

/**
 * An utility function that retrieves the preferred locale that correspond to a path.
 *
 * @param path
 * @param locales
 */
export function getLocaleByPath(path: string, locales: Locales): string | undefined {
	for (const locale of locales) {
		if (typeof locale !== 'string') {
			if (locale.path === path) {
				// the first code is the one that user usually wants
				const code = locale.codes.at(0);
				return code;
			}
		} else if (locale === path) {
			return locale;
		}
	}
	return undefined;
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

/**
 * Returns an array of only locales, by picking the `code`
 * @param locales
 */
export function toCodes(locales: Locales): string[] {
	const codes: string[] = [];
	for (const locale of locales) {
		if (typeof locale === 'string') {
			codes.push(locale);
		} else {
			for (const code of locale.codes) {
				codes.push(code);
			}
		}
	}
	return codes;
}

/**
 * It returns the array of paths
 * @param locales
 */
export function toPaths(locales: Locales): string[] {
	return locales.map((loopLocale) => {
		if (typeof loopLocale === 'string') {
			return loopLocale;
		} else {
			return loopLocale.path;
		}
	});
}

function peekCodePathToUse(locales: Locales, locale: string): undefined | string {
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

	return undefined;
}

import type { Locales } from '../types/public/config.js';
type BrowserLocale = {
	locale: string;
	qualityValue: number | undefined;
};
/**
 * Parses the value of the `Accept-Language` header:
 *
 * More info: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language
 *
 * Complex example: `fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5`
 *
 */
export declare function parseLocale(header: string): BrowserLocale[];
/**
 * Set the current locale by parsing the value passed from the `Accept-Header`.
 *
 * If multiple locales are present in the header, they are sorted by their quality value and the highest is selected as current locale.
 *
 */
export declare function computePreferredLocale(
	request: Request,
	locales: Locales,
): string | undefined;
export declare function computePreferredLocaleList(request: Request, locales: Locales): string[];
export declare function computeCurrentLocale(
	pathname: string,
	locales: Locales,
	defaultLocale: string,
): string | undefined;
/**
 * Check if any of the route's resolved param values match a configured locale.
 * This handles dynamic routes like `[locale]` or `[...path]` where the locale
 * isn't in a static segment of the route pathname.
 */
export declare function computeCurrentLocaleFromParams(
	params: Record<string, string | undefined>,
	locales: Locales,
): string | undefined;
export {};

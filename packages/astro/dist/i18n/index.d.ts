import type { RoutingStrategies } from '../core/app/common.js';
import type { SSRManifest } from '../core/app/types.js';
import type { AstroConfig, Locales, ValidRedirectStatus } from '../types/public/config.js';
import type { APIContext } from '../types/public/context.js';
export declare function requestHasLocale(locales: Locales): (context: APIContext) => boolean;
export declare function pathHasLocale(path: string, locales: Locales): boolean;
type GetLocaleRelativeUrl = GetLocaleOptions & {
	locale: string;
	base: string;
	locales: Locales;
	trailingSlash: AstroConfig['trailingSlash'];
	format: NonNullable<AstroConfig['build']['format']>;
	strategy?: RoutingStrategies;
	defaultLocale: string;
	domains: Record<string, string> | undefined;
	path?: string;
};
export type GetLocaleOptions = {
	/**
	 * Makes the locale URL-friendly by replacing underscores with dashes, and converting the locale to lowercase.
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
export declare function getLocaleRelativeUrl({
	locale,
	base,
	locales: _locales,
	trailingSlash,
	format,
	path,
	prependWith,
	normalizeLocale,
	strategy,
	defaultLocale,
}: GetLocaleRelativeUrl): string;
/**
 * The absolute URL
 */
export declare function getLocaleAbsoluteUrl({
	site,
	isBuild,
	...rest
}: GetLocaleAbsoluteUrl): string;
interface GetLocalesRelativeUrlList extends GetLocaleOptions {
	base: string;
	path?: string;
	locales: Locales;
	trailingSlash: AstroConfig['trailingSlash'];
	format: AstroConfig['build']['format'];
	strategy?: RoutingStrategies;
	defaultLocale: string;
	domains: Record<string, string> | undefined;
}
export declare function getLocaleRelativeUrlList({
	locales: _locales,
	...rest
}: GetLocalesRelativeUrlList): string[];
interface GetLocalesAbsoluteUrlList extends GetLocalesRelativeUrlList {
	site: AstroConfig['site'];
	isBuild: boolean;
}
export declare function getLocaleAbsoluteUrlList(params: GetLocalesAbsoluteUrlList): string[];
/**
 * Given a locale (code), it returns its corresponding path
 * @param locale
 * @param locales
 */
export declare function getPathByLocale(locale: string, locales: Locales): string;
/**
 * A utility function that retrieves the preferred locale that correspond to a path.
 *
 * @param path
 * @param locales
 */
export declare function getLocaleByPath(path: string, locales: Locales): string;
/**
 *
 * Given a locale, this function:
 * - replaces the `_` with a `-`;
 * - transforms all letters to be lowercase;
 */
export declare function normalizeTheLocale(locale: string): string;
/**
 *
 * Given a path or path segment, this function:
 * - removes the `.html` extension if it exists
 */
export declare function normalizeThePath(path: string): string;
/**
 * Returns an array of only locales, by picking the `code`
 * @param locales
 */
export declare function getAllCodes(locales: Locales): string[];
export declare function toCodes(locales: Locales): string[];
/**
 * It returns the array of paths
 * @param locales
 */
export declare function toPaths(locales: Locales): string[];
export type MiddlewarePayload = {
	base: string;
	locales: Locales;
	trailingSlash: AstroConfig['trailingSlash'];
	format: AstroConfig['build']['format'];
	strategy: RoutingStrategies;
	defaultLocale: string;
	domains: Record<string, string> | undefined;
	fallback: Record<string, string> | undefined;
	fallbackType: 'redirect' | 'rewrite';
};
export declare function redirectToDefaultLocale({
	trailingSlash,
	format,
	base,
	defaultLocale,
}: MiddlewarePayload): (context: APIContext, statusCode?: ValidRedirectStatus) => Response;
export declare function notFound({
	base,
	locales,
	fallback,
}: MiddlewarePayload): (context: APIContext, response?: Response) => Response | undefined;
export type RedirectToFallback = (context: APIContext, response: Response) => Promise<Response>;
export declare function redirectToFallback({
	fallback,
	locales,
	defaultLocale,
	strategy,
	base,
	fallbackType,
}: MiddlewarePayload): (context: APIContext, response: Response) => Promise<Response>;
export declare function createMiddleware(
	i18nManifest: SSRManifest['i18n'],
	base: SSRManifest['base'],
	trailingSlash: SSRManifest['trailingSlash'],
	format: SSRManifest['buildFormat'],
): import('../index.js').MiddlewareHandler;
export {};

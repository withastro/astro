import type { RedirectToFallback } from '../i18n/index.js';
import * as I18nInternals from '../i18n/index.js';
import type { MiddlewareHandler } from '../types/public/common.js';
import type { AstroConfig, ValidRedirectStatus } from '../types/public/config.js';
import type { APIContext } from '../types/public/context.js';
export type GetLocaleOptions = I18nInternals.GetLocaleOptions;
/**
 * @param locale A locale
 * @param path An optional path to add after the `locale`.
 * @param options Customise the generated path
 *
 * Returns a _relative_ path with passed locale.
 *
 * ## Errors
 *
 * Throws an error if the locale doesn't exist in the list of locales defined in the configuration.
 *
 * ## Examples
 *
 * ```js
 * import { getRelativeLocaleUrl } from "astro:i18n";
 * getRelativeLocaleUrl("es"); // /es
 * getRelativeLocaleUrl("es", "getting-started"); // /es/getting-started
 * getRelativeLocaleUrl("es_US", "getting-started", { prependWith: "blog" }); // /blog/es-us/getting-started
 * getRelativeLocaleUrl("es_US", "getting-started", { prependWith: "blog", normalizeLocale: false }); // /blog/es_US/getting-started
 * ```
 */
export declare const getRelativeLocaleUrl: (
	locale: string,
	path?: string,
	options?: GetLocaleOptions,
) => string;
/**
 *
 * @param locale A locale
 * @param path An optional path to add after the `locale`.
 * @param options Customise the generated path
 *
 * Returns an absolute path with the passed locale. The behaviour is subject to change based on `site` configuration.
 * If _not_ provided, the function will return a _relative_ URL.
 *
 * ## Errors
 *
 * Throws an error if the locale doesn't exist in the list of locales defined in the configuration.
 *
 * ## Examples
 *
 * If `site` is `https://example.com`:
 *
 * ```js
 * import { getAbsoluteLocaleUrl } from "astro:i18n";
 * getAbsoluteLocaleUrl("es"); // https://example.com/es
 * getAbsoluteLocaleUrl("es", "getting-started"); // https://example.com/es/getting-started
 * getAbsoluteLocaleUrl("es_US", "getting-started", { prependWith: "blog" }); // https://example.com/blog/es-us/getting-started
 * getAbsoluteLocaleUrl("es_US", "getting-started", { prependWith: "blog", normalizeLocale: false }); // https://example.com/blog/es_US/getting-started
 * ```
 */
export declare const getAbsoluteLocaleUrl: (
	locale: string,
	path?: string,
	options?: GetLocaleOptions,
) => string;
/**
 * @param path An optional path to add after the `locale`.
 * @param options Customise the generated path
 *
 * Works like `getRelativeLocaleUrl` but it emits the relative URLs for ALL locales:
 */
export declare const getRelativeLocaleUrlList: (
	path?: string,
	options?: GetLocaleOptions,
) => string[];
/**
 * @param path An optional path to add after the `locale`.
 * @param options Customise the generated path
 *
 * Works like `getAbsoluteLocaleUrl` but it emits the absolute URLs for ALL locales:
 */
export declare const getAbsoluteLocaleUrlList: (
	path?: string,
	options?: GetLocaleOptions,
) => string[];
/**
 * A function that return the `path` associated to a locale (defined as code). It's particularly useful in case you decide
 * to use locales that are broken down in paths and codes.
 *
 * @param locale The code of the locale
 * @returns The path associated to the locale
 *
 * ## Example
 *
 * ```js
 * // astro.config.mjs
 *
 * export default defineConfig({
 * 	i18n: {
 * 		locales: [
 * 			{ codes: ["it", "it-VT"], path: "italiano" },
 * 			"es"
 * 		]
 * 	}
 * })
 * ```
 *
 * ```js
 * import { getPathByLocale } from "astro:i18n";
 * getPathByLocale("it"); // returns "italiano"
 * getPathByLocale("it-VT"); // returns "italiano"
 * getPathByLocale("es"); // returns "es"
 * ```
 */
export declare const getPathByLocale: (locale: string) => string;
/**
 * A function that returns the preferred locale given a certain path. This is particularly useful if you configure a locale using
 * `path` and `codes`. When you define multiple `code`, this function will return the first code of the array.
 *
 * Astro will treat the first code as the one that the user prefers.
 *
 * @param path The path that maps to a locale
 * @returns The path associated to the locale
 *
 * ## Example
 *
 * ```js
 * // astro.config.mjs
 *
 * export default defineConfig({
 * 	i18n: {
 * 		locales: [
 * 			{ codes: ["it-VT", "it"], path: "italiano" },
 * 			"es"
 * 		]
 * 	}
 * })
 * ```
 *
 * ```js
 * import { getLocaleByPath } from "astro:i18n";
 * getLocaleByPath("italiano"); // returns "it-VT" because that's the first code configured
 * getLocaleByPath("es"); // returns "es"
 * ```
 */
export declare const getLocaleByPath: (path: string) => string;
/**
 * A function that can be used to check if the current path contains a configured locale.
 *
 * @param path The path that maps to a locale
 * @returns Whether the `path` has the locale
 *
 * ## Example
 *
 * Given the following configuration:
 *
 * ```js
 * // astro.config.mjs
 *
 * export default defineConfig({
 * 	i18n: {
 * 		locales: [
 * 			{ codes: ["it-VT", "it"], path: "italiano" },
 * 			"es"
 * 		]
 * 	}
 * })
 * ```
 *
 * Here's some use cases:
 *
 * ```js
 * import { pathHasLocale } from "astro:i18n";
 * pathHasLocale("italiano"); // returns `true`
 * pathHasLocale("es"); // returns `true`
 * pathHasLocale("it-VT"); // returns `false`
 * ```
 */
export declare const pathHasLocale: (path: string) => boolean;
/**
 *
 * This function returns a redirect to the default locale configured in the
 *
 * @param {APIContext} context The context passed to the middleware
 * @param {ValidRedirectStatus?} statusCode An optional status code for the redirect.
 */
export declare let redirectToDefaultLocale: (
	context: APIContext,
	statusCode?: ValidRedirectStatus,
) => Response | undefined;
/**
 *
 * Use this function to return a 404 when:
 * - the current path isn't a root. e.g. / or /<base>
 * - the URL doesn't contain a locale
 *
 * When a `Response` is passed, the new `Response` emitted by this function will contain the same headers of the original response.
 *
 * @param {APIContext} context The context passed to the middleware
 * @param {Response?} response An optional `Response` in case you're handling a `Response` coming from the `next` function.
 *
 */
export declare let notFound: (context: APIContext, response?: Response) => Response | undefined;
/**
 * Checks whether the current URL contains a configured locale. Internally, this function will use `APIContext#url.pathname`
 *
 * @param {APIContext} context The context passed to the middleware
 */
export declare let requestHasLocale: (context: APIContext) => boolean;
/**
 * Allows to use the built-in fallback system of Astro
 *
 * @param {APIContext} context The context passed to the middleware
 * @param {Promise<Response>} response An optional `Response` in case you're handling a `Response` coming from the `next` function.
 */
export declare let redirectToFallback: RedirectToFallback;
type OnlyObject<T> = T extends object ? T : never;
export type I18nMiddlewareOptions = {
	fallbackType: OnlyObject<NonNullable<AstroConfig['i18n']>['routing']>['fallbackType'];
} & (
	| {
			prefixDefaultLocale: false;
			redirectToDefaultLocale: false;
	  }
	| {
			prefixDefaultLocale: true;
			redirectToDefaultLocale: boolean;
	  }
);
/**
 * @param {AstroConfig['i18n']['routing']} customOptions
 *
 * A function that allows to programmatically create the Astro i18n middleware.
 *
 * This is use useful when you still want to use the default i18n logic, but add only few exceptions to your website.
 *
 * ## Examples
 *
 * ```js
 * // middleware.js
 * import { middleware } from "astro:i18n";
 * import { sequence, defineMiddleware } from "astro:middleware";
 *
 * const customLogic = defineMiddleware(async (context, next) => {
 *   const response = await next();
 *
 *   // Custom logic after resolving the response.
 *   // It's possible to catch the response coming from Astro i18n middleware.
 *
 *   return response;
 * });
 *
 * export const onRequest = sequence(customLogic, middleware({
 * 	prefixDefaultLocale: true,
 * 	redirectToDefaultLocale: false
 * }))
 *
 * ```
 */
export declare let middleware: (customOptions: I18nMiddlewareOptions) => MiddlewareHandler;
/**
 * Replaces underscores (`_`) with hyphens (`-`) in the given locale before
 * returning a lowercase version.
 *
 * @param {string} locale A locale code to normalize.
 * @returns {string} The normalized locale.
 *
 * ## Example
 *
 * ```js
 * import { normalizeTheLocale } from "astro:i18n";
 * normalizeTheLocale("it_VT") // returns `it-vt`
 * ```
 */
export declare const normalizeTheLocale: typeof I18nInternals.normalizeTheLocale;
/**
 * Retrieves the configured locale codes for each locale defined in your
 * configuration. When multiple codes are associated to a locale, only the
 * first one will be added to the array.
 *
 * @param {Locales} locales The configured locales.
 * @returns {string[]} The configured locales codes.
 *
 * ## Example
 *
 * Given the following configuration:
 *
 * ```js
 * // astro.config.mjs
 *
 * export default defineConfig({
 * 	i18n: {
 * 		locales: [
 * 			{ codes: ["it-VT", "it"], path: "italiano" },
 * 			"es"
 * 		]
 * 	}
 * })
 * ```
 *
 * Here's a use case:
 *
 * ```js
 * import { i18n } from "astro:config/client";
 * import { toCodes } from "astro:i18n";
 * toCodes(i18n.locales); // ["it-VT", "es"]
 * ```
 */
export declare const toCodes: typeof I18nInternals.toCodes;
/**
 * Retrieves the configured locale paths for each locale defined in your
 * configuration.
 *
 * @param {Locales} locales The configured locales.
 * @returns {string[]} The configured locales paths.
 *
 * ## Example
 *
 * Given the following configuration:
 *
 * ```js
 * // astro.config.mjs
 *
 * export default defineConfig({
 * 	i18n: {
 * 		locales: [
 * 			{ codes: ["it-VT", "it"], path: "italiano" },
 * 			"es"
 * 		]
 * 	}
 * })
 * ```
 *
 * Here's a use case:
 *
 * ```js
 * import { i18n } from "astro:config/client";
 * import { toPaths } from "astro:i18n";
 * toPaths(i18n.locales); // ["italiano", "es"]
 * ```
 */
export declare const toPaths: typeof I18nInternals.toPaths;
export {};

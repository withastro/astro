import type { RoutingStrategies } from '../../../dist/core/app/common.js';
import type { AstroConfig } from '../../../dist/index.js';

/**
 * Creates an i18n router config for testing
 */
export function makeI18nRouterConfig({
	strategy = 'pathname-prefix-other-locales',
	defaultLocale = 'en',
	locales = ['en', 'es', 'pt'],
	base = '',
	domains,
}: {
	strategy?: RoutingStrategies;
	defaultLocale?: string;
	locales?: Array<string>;
	base?: string;
	domains?: Record<string, string[]>;
} = {}) {
	return { strategy, defaultLocale, locales, base, domains };
}

/**
 * Creates router context for testing
 */
export function makeRouterContext({
	currentLocale,
	currentDomain = 'example.com',
	routeType = 'page',
	isReroute = false,
}: {
	currentLocale: string | undefined;
	currentDomain?: string;
	routeType?: string;
	isReroute?: boolean;
}) {
	return { currentLocale, currentDomain, routeType, isReroute };
}

/**
 * Creates fallback options for testing
 */
export function makeFallbackOptions({
	pathname,
	responseStatus = 404,
	currentLocale,
	fallback = {},
	fallbackType = 'redirect',
	locales = ['en', 'es', 'pt'],
	defaultLocale = 'en',
	strategy = 'pathname-prefix-other-locales',
	base = '',
}: {
	pathname: string;
	responseStatus?: number;
	currentLocale: string | undefined;
	fallback?: Record<string, string>;
	fallbackType?: 'redirect' | 'rewrite';
	locales?: Array<string>;
	defaultLocale?: string;
	strategy?: RoutingStrategies;
	base?: string;
}) {
	return {
		pathname,
		responseStatus,
		currentLocale,
		fallback,
		fallbackType,
		locales,
		defaultLocale,
		strategy,
		base,
	};
}

/**
 * Creates a minimal mock APIContext for manual routing tests.
 *
 * This helper creates a mock context object that mimics Astro's APIContext
 * with the essential properties needed for testing i18n manual routing functions
 * like requestHasLocale, redirectToDefaultLocale, and notFound.

 * @example
 * const context = createManualRoutingContext({ pathname: '/en/blog' });
 * const hasLocale = requestHasLocale(['en', 'es']);
 * hasLocale(context); // true
 */
export function createManualRoutingContext({
	pathname = '/',
	hostname = 'localhost',
	method = 'GET',
	currentLocale,
	...options
}: {
	pathname?: string;
	hostname?: string;
	method?: string;
	currentLocale?: string;
} = {}) {
	const url = new URL(`http://${hostname}${pathname}`);
	const request = new Request(url.toString(), { method });

	return {
		url,
		request,
		currentLocale,
		redirect(path: string, status = 302) {
			return new Response(null, {
				status,
				headers: { Location: path },
			});
		},
		...options,
	};
}

/**
 * Creates a MiddlewarePayload for testing manual routing functions.
 *
 * This helper creates a payload object that matches the MiddlewarePayload type
 * used by i18n manual routing functions like redirectToDefaultLocale and notFound.
 * It provides sensible defaults for all required fields.

 * @example
 * const payload = createMiddlewarePayload({
 *   base: '/blog',
 *   defaultLocale: 'en',
 *   locales: ['en', 'es', 'pt']
 * });
 * const redirect = redirectToDefaultLocale(payload);
 */
export function createMiddlewarePayload({
	base = '',
	locales = ['en', 'es'],
	trailingSlash = 'ignore',
	format = 'directory',
	strategy = 'pathname-prefix-other-locales',
	defaultLocale = 'en',
	domains = undefined,
	fallback = undefined,
	fallbackType = 'redirect',
}: {
	base?: string;
	locales?: Array<string>;
	trailingSlash?: AstroConfig['trailingSlash'];
	format?: AstroConfig['build']['format'];
	strategy?: RoutingStrategies;
	defaultLocale?: string;
	domains?: Record<string, string[]>;
	fallback?: Record<string, string>;
	fallbackType?: 'redirect' | 'rewrite';
} = {}) {
	return {
		base,
		locales,
		trailingSlash,
		format,
		strategy,
		defaultLocale,
		domains,
		fallback,
		fallbackType,
	};
}

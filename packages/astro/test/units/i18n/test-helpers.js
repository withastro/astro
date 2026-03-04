// @ts-check

/**
 * Creates an i18n router config for testing
 * @param {object} [options]
 * @param {import('../../../dist/core/app/common.js').RoutingStrategies} [options.strategy]
 * @param {string} [options.defaultLocale]
 * @param {import('../../../src/types/public/config.js').Locales} [options.locales]
 * @param {string} [options.base]
 * @param {Record<string, string[]>} [options.domains]
 */
export function makeI18nRouterConfig({
	strategy = 'pathname-prefix-other-locales',
	defaultLocale = 'en',
	locales = ['en', 'es', 'pt'],
	base = '',
	domains,
} = {}) {
	return { strategy, defaultLocale, locales, base, domains };
}

/**
 * Creates router context for testing
 * @param {object} [options]
 * @param {string | undefined} [options.currentLocale]
 * @param {string} [options.currentDomain]
 * @param {string} [options.routeType]
 * @param {boolean} [options.isReroute]
 */
export function makeRouterContext({
	currentLocale,
	currentDomain = 'example.com',
	routeType = 'page',
	isReroute = false,
} = {}) {
	return { currentLocale, currentDomain, routeType, isReroute };
}

/**
 * Creates fallback options for testing
 * @param {object} options
 * @param {string} options.pathname
 * @param {number} [options.responseStatus]
 * @param {string | undefined} [options.currentLocale]
 * @param {Record<string, string>} [options.fallback]
 * @param {'redirect' | 'rewrite'} [options.fallbackType]
 * @param {import('../../../src/types/public/config.js').Locales} [options.locales]
 * @param {string} [options.defaultLocale]
 * @param {import('../../../dist/core/app/common.js').RoutingStrategies} [options.strategy]
 * @param {string} [options.base]
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
 *
 * @param {object} [options] - Configuration options for the mock context
 * @param {string} [options.pathname='/'] - The pathname for the URL (e.g., '/en/blog')
 * @param {string} [options.hostname='localhost'] - The hostname for the URL
 * @param {string} [options.method='GET'] - The HTTP method for the request
 * @param {string | undefined} [options.currentLocale] - The current locale from the context
 * @returns {object} A mock APIContext object with url, request, currentLocale, and redirect method
 *
 * @example
 * const context = createManualRoutingContext({ pathname: '/en/blog' });
 * const hasLocale = requestHasLocale(['en', 'es']);
 * hasLocale(context); // true
 */
export function createManualRoutingContext({
	pathname = '/',
	hostname = 'localhost',
	method = 'GET',
	currentLocale = undefined,
	...options
} = {}) {
	const url = new URL(`http://${hostname}${pathname}`);
	const request = new Request(url.toString(), { method });

	return {
		url,
		request,
		currentLocale,
		redirect(path, status = 302) {
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
 *
 * @param {object} [options] - Configuration options for the middleware payload
 * @param {string} [options.base=''] - The base path for the site (e.g., '/blog')
 * @param {import('../../../src/types/public/config.js').Locales} [options.locales=['en', 'es']] - Array of locale strings or locale objects
 * @param {'always' | 'never' | 'ignore'} [options.trailingSlash='ignore'] - Trailing slash behavior
 * @param {'directory' | 'file'} [options.format='directory'] - Build output format
 * @param {import('../../../dist/core/app/common.js').RoutingStrategies} [options.strategy='pathname-prefix-other-locales'] - i18n routing strategy
 * @param {string} [options.defaultLocale='en'] - The default locale
 * @param {Record<string, string> | undefined} [options.domains] - Domain-to-locale mapping
 * @param {Record<string, string> | undefined} [options.fallback] - Fallback locale configuration
 * @param {'redirect' | 'rewrite'} [options.fallbackType='redirect'] - Type of fallback behavior
 * @returns {object} A MiddlewarePayload object
 *
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

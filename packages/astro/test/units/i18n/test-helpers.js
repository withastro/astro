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

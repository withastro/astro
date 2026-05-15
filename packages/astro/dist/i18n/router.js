import { removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';
import { normalizeTheLocale, pathHasLocale } from './index.js';
class I18nRouter {
	#strategy;
	#defaultLocale;
	#locales;
	#base;
	#domains;
	constructor(options) {
		this.#strategy = options.strategy;
		this.#defaultLocale = options.defaultLocale;
		this.#locales = options.locales;
		this.#base = options.base === '/' ? '/' : removeTrailingForwardSlash(options.base || '');
		this.#domains = options.domains;
	}
	/**
	 * Evaluate routing strategy for a pathname.
	 * Returns decision object (not HTTP Response).
	 */
	match(pathname, context) {
		if (this.shouldSkipProcessing(pathname, context)) {
			return { type: 'continue' };
		}
		switch (this.#strategy) {
			case 'manual':
				return { type: 'continue' };
			case 'pathname-prefix-always':
				return this.matchPrefixAlways(pathname, context);
			case 'domains-prefix-always':
				if (this.localeHasntDomain(context.currentLocale, context.currentDomain)) {
					return { type: 'continue' };
				}
				return this.matchPrefixAlways(pathname, context);
			case 'pathname-prefix-other-locales':
				return this.matchPrefixOtherLocales(pathname, context);
			case 'domains-prefix-other-locales':
				if (this.localeHasntDomain(context.currentLocale, context.currentDomain)) {
					return { type: 'continue' };
				}
				return this.matchPrefixOtherLocales(pathname, context);
			case 'pathname-prefix-always-no-redirect':
				return this.matchPrefixAlwaysNoRedirect(pathname, context);
			case 'domains-prefix-always-no-redirect':
				if (this.localeHasntDomain(context.currentLocale, context.currentDomain)) {
					return { type: 'continue' };
				}
				return this.matchPrefixAlwaysNoRedirect(pathname, context);
			default:
				return { type: 'continue' };
		}
	}
	/**
	 * Check if i18n processing should be skipped for this request
	 */
	shouldSkipProcessing(pathname, context) {
		if (pathname.includes('/404') || pathname.includes('/500')) {
			return true;
		}
		if (pathname.includes('/_server-islands/')) {
			return true;
		}
		if (context.isReroute) {
			return true;
		}
		if (context.routeType && context.routeType !== 'page' && context.routeType !== 'fallback') {
			return true;
		}
		return false;
	}
	/**
	 * Strategy: pathname-prefix-always
	 * All locales must have a prefix, including the default locale.
	 */
	matchPrefixAlways(pathname, _context) {
		const isRoot = pathname === this.#base + '/' || pathname === this.#base;
		if (isRoot) {
			const basePrefix = this.#base === '/' ? '' : this.#base;
			return {
				type: 'redirect',
				location: `${basePrefix}/${this.#defaultLocale}`,
			};
		}
		if (!pathHasLocale(pathname, this.#locales)) {
			return { type: 'notFound' };
		}
		return { type: 'continue' };
	}
	/**
	 * Strategy: pathname-prefix-other-locales
	 * Default locale has no prefix, other locales must have a prefix.
	 */
	matchPrefixOtherLocales(pathname, _context) {
		let pathnameContainsDefaultLocale = false;
		for (const segment of pathname.split('/')) {
			if (normalizeTheLocale(segment) === normalizeTheLocale(this.#defaultLocale)) {
				pathnameContainsDefaultLocale = true;
				break;
			}
		}
		if (pathnameContainsDefaultLocale) {
			const newLocation = pathname.replace(`/${this.#defaultLocale}`, '');
			return {
				type: 'notFound',
				location: newLocation,
			};
		}
		return { type: 'continue' };
	}
	/**
	 * Strategy: pathname-prefix-always-no-redirect
	 * Like prefix-always but allows root to serve instead of redirecting
	 */
	matchPrefixAlwaysNoRedirect(pathname, _context) {
		const isRoot = pathname === this.#base + '/' || pathname === this.#base;
		if (isRoot) {
			return { type: 'continue' };
		}
		if (!pathHasLocale(pathname, this.#locales)) {
			return { type: 'notFound' };
		}
		return { type: 'continue' };
	}
	/**
	 * Check if the current locale doesn't belong to the configured domain.
	 * Used for domain-based routing strategies.
	 */
	localeHasntDomain(currentLocale, currentDomain) {
		if (!this.#domains || !currentDomain) {
			return false;
		}
		if (!currentLocale) {
			return false;
		}
		const localesForDomain = this.#domains[currentDomain];
		if (!localesForDomain) {
			return true;
		}
		return !localesForDomain.includes(currentLocale);
	}
}
export { I18nRouter };

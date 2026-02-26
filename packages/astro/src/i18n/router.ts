import { removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';
import type { SSRManifest, SSRManifestI18n } from '../core/app/types.js';
import type { Locales, ValidRedirectStatus } from '../types/public/config.js';
import type { APIContext } from '../types/public/context.js';
import { normalizeTheLocale, pathHasLocale } from './index.js';
import type { RoutingStrategies } from '../core/app/common.js';

/**
 * I18n routing decision types
 */
export type I18nRouterMatch =
	| { type: 'continue' }
	| { type: 'redirect'; location: string; status?: ValidRedirectStatus }
	| { type: 'notFound'; location?: string };

/**
 * Options for i18n router.
 * Uses types from SSRManifest to ensure type safety.
 */
export interface I18nRouterOptions {
	/** Routing strategy from i18n manifest */
	strategy: SSRManifestI18n['strategy'];
	/** Default locale from i18n manifest */
	defaultLocale: SSRManifestI18n['defaultLocale'];
	/** Locales from i18n manifest */
	locales: SSRManifestI18n['locales'];
	/** Base path from manifest */
	base: SSRManifest['base'];
	/** Domain mapping (domain -> locale[]) */
	domains?: Record<string, string[]>;
}

/**
 * Context for i18n router decisions.
 * Uses types from APIContext to ensure type safety.
 */
export interface I18nRouterContext {
	/** Current locale from APIContext */
	currentLocale: APIContext['currentLocale'];
	/** Current domain from url.hostname */
	currentDomain: APIContext['url']['hostname'];
	/** Route type from response headers */
	routeType?: 'page' | 'fallback';
	/** Whether this is a reroute from response headers */
	isReroute: boolean;
}

/**
 * Router for i18n routing strategy decisions.
 * Determines whether to continue, redirect, or return 404 based on pathname and locale.
 *
 * This is a pure class that returns decision objects (not HTTP Responses).
 * The middleware layer is responsible for converting decisions to HTTP responses.
 */
export class I18nRouter {
	#strategy: RoutingStrategies;
	#defaultLocale: string;
	#locales: Locales;
	#base: string;
	#domains?: Record<string, string[]>;

	constructor(options: I18nRouterOptions) {
		this.#strategy = options.strategy;
		this.#defaultLocale = options.defaultLocale;
		this.#locales = options.locales;
		// Normalize base to not have trailing slash (except for root '/')
		this.#base = options.base === '/' ? '/' : removeTrailingForwardSlash(options.base || '');
		this.#domains = options.domains;
	}

	/**
	 * Evaluate routing strategy for a pathname.
	 * Returns decision object (not HTTP Response).
	 */
	public match(pathname: string, context: I18nRouterContext): I18nRouterMatch {
		// Skip i18n processing for certain route types
		if (this.shouldSkipProcessing(pathname, context)) {
			return { type: 'continue' };
		}

		// Apply strategy-specific logic
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
	private shouldSkipProcessing(pathname: string, context: I18nRouterContext): boolean {
		// Skip 404/500 pages
		if (pathname.includes('/404') || pathname.includes('/500')) {
			return true;
		}

		// Skip server islands
		if (pathname.includes('/_server-islands/')) {
			return true;
		}

		// Skip reroutes
		if (context.isReroute) {
			return true;
		}

		// Skip non-page routes (unless it's a fallback)
		if (context.routeType && context.routeType !== 'page' && context.routeType !== 'fallback') {
			return true;
		}

		return false;
	}

	/**
	 * Strategy: pathname-prefix-always
	 * All locales must have a prefix, including the default locale.
	 */
	private matchPrefixAlways(pathname: string, _context: I18nRouterContext): I18nRouterMatch {
		const isRoot = pathname === this.#base + '/' || pathname === this.#base;

		if (isRoot) {
			// Redirect root to default locale
			return {
				type: 'redirect',
				location: `${this.#base}/${this.#defaultLocale}`,
			};
		}

		// Check if pathname has a locale
		if (!pathHasLocale(pathname, this.#locales)) {
			return { type: 'notFound' };
		}

		return { type: 'continue' };
	}

	/**
	 * Strategy: pathname-prefix-other-locales
	 * Default locale has no prefix, other locales must have a prefix.
	 */
	private matchPrefixOtherLocales(pathname: string, _context: I18nRouterContext): I18nRouterMatch {
		// Check if pathname contains the default locale as a segment
		let pathnameContainsDefaultLocale = false;
		for (const segment of pathname.split('/')) {
			if (normalizeTheLocale(segment) === normalizeTheLocale(this.#defaultLocale)) {
				pathnameContainsDefaultLocale = true;
				break;
			}
		}

		if (pathnameContainsDefaultLocale) {
			// Default locale should not have a prefix - return 404 with Location header
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
	private matchPrefixAlwaysNoRedirect(
		pathname: string,
		_context: I18nRouterContext,
	): I18nRouterMatch {
		const isRoot = pathname === this.#base + '/' || pathname === this.#base;

		// Root path is allowed (will be served by the default locale)
		if (isRoot) {
			return { type: 'continue' };
		}

		// Non-root paths must have a locale
		if (!pathHasLocale(pathname, this.#locales)) {
			return { type: 'notFound' };
		}

		return { type: 'continue' };
	}

	/**
	 * Check if the current locale doesn't belong to the configured domain.
	 * Used for domain-based routing strategies.
	 */
	private localeHasntDomain(currentLocale: string | undefined, currentDomain?: string): boolean {
		if (!this.#domains || !currentDomain) {
			return false;
		}

		if (!currentLocale) {
			return false;
		}

		// Check if current locale is in the list of locales for this domain
		const localesForDomain = this.#domains[currentDomain];
		if (!localesForDomain) {
			return true;
		}

		return !localesForDomain.includes(currentLocale);
	}
}

import type { SSRManifest, SSRManifestI18n } from '../core/app/types.js';
import type { ValidRedirectStatus } from '../types/public/config.js';
import type { APIContext } from '../types/public/context.js';
/**
 * I18n routing decision types
 */
export type I18nRouterMatch =
	| {
			type: 'continue';
	  }
	| {
			type: 'redirect';
			location: string;
			status?: ValidRedirectStatus;
	  }
	| {
			type: 'notFound';
			location?: string;
	  };
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
export declare class I18nRouter {
	#private;
	constructor(options: I18nRouterOptions);
	/**
	 * Evaluate routing strategy for a pathname.
	 * Returns decision object (not HTTP Response).
	 */
	match(pathname: string, context: I18nRouterContext): I18nRouterMatch;
	/**
	 * Check if i18n processing should be skipped for this request
	 */
	private shouldSkipProcessing;
	/**
	 * Strategy: pathname-prefix-always
	 * All locales must have a prefix, including the default locale.
	 */
	private matchPrefixAlways;
	/**
	 * Strategy: pathname-prefix-other-locales
	 * Default locale has no prefix, other locales must have a prefix.
	 */
	private matchPrefixOtherLocales;
	/**
	 * Strategy: pathname-prefix-always-no-redirect
	 * Like prefix-always but allows root to serve instead of redirecting
	 */
	private matchPrefixAlwaysNoRedirect;
	/**
	 * Check if the current locale doesn't belong to the configured domain.
	 * Used for domain-based routing strategies.
	 */
	private localeHasntDomain;
}

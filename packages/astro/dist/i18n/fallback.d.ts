import type { SSRManifest, SSRManifestI18n } from '../core/app/types.js';
import type { APIContext } from '../types/public/context.js';
/**
 * Fallback routing decision types
 */
export type FallbackRouteResult =
	| {
			type: 'none';
	  }
	| {
			type: 'redirect';
			pathname: string;
	  }
	| {
			type: 'rewrite';
			pathname: string;
	  };
/**
 * Options for computing fallback routes.
 * Uses types from APIContext and SSRManifest to ensure type safety.
 */
export interface ComputeFallbackRouteOptions {
	/** Pathname from url.pathname */
	pathname: APIContext['url']['pathname'];
	/** Response status code */
	responseStatus: number;
	/** Current locale from APIContext */
	currentLocale: APIContext['currentLocale'];
	/** Fallback configuration from i18n manifest */
	fallback: NonNullable<SSRManifestI18n['fallback']>;
	/** Fallback type from i18n manifest */
	fallbackType: SSRManifestI18n['fallbackType'];
	/** Locales from i18n manifest */
	locales: SSRManifestI18n['locales'];
	/** Default locale from i18n manifest */
	defaultLocale: SSRManifestI18n['defaultLocale'];
	/** Routing strategy from i18n manifest */
	strategy: SSRManifestI18n['strategy'];
	/** Base path from manifest */
	base: SSRManifest['base'];
}
/**
 * Compute fallback route for failed responses.
 * Pure function - no APIContext, no Response objects, no URL objects.
 *
 * This function determines whether a failed request should be redirected or rewritten
 * to a fallback locale based on the i18n configuration.
 */
export declare function computeFallbackRoute(
	options: ComputeFallbackRouteOptions,
): FallbackRouteResult;

import type { SSRManifest, SSRManifestI18n } from '../core/app/types.js';
import type { APIContext } from '../types/public/context.js';
import { getPathByLocale } from './index.js';

/**
 * Fallback routing decision types
 */
export type FallbackRouteResult =
	| { type: 'none' } // No fallback needed
	| { type: 'redirect'; pathname: string } // Redirect to fallback locale
	| { type: 'rewrite'; pathname: string }; // Rewrite to fallback locale

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
export function computeFallbackRoute(options: ComputeFallbackRouteOptions): FallbackRouteResult {
	const {
		pathname,
		responseStatus,
		fallback,
		fallbackType,
		locales,
		defaultLocale,
		strategy,
		base,
	} = options;

	// Only apply fallback for 3xx+ status codes
	if (responseStatus < 300) {
		return { type: 'none' };
	}

	// No fallback configured
	if (!fallback || Object.keys(fallback).length === 0) {
		return { type: 'none' };
	}

	// Extract locale from pathname
	const segments = pathname.split('/');
	const urlLocale = segments.find((segment) => {
		for (const locale of locales) {
			if (typeof locale === 'string') {
				if (locale === segment) {
					return true;
				}
			} else if (locale.path === segment) {
				return true;
			}
		}
		return false;
	});

	// No locale found in pathname
	if (!urlLocale) {
		return { type: 'none' };
	}

	// Check if this locale has a fallback configured
	const fallbackKeys = Object.keys(fallback);
	if (!fallbackKeys.includes(urlLocale)) {
		return { type: 'none' };
	}

	// Get the fallback locale
	const fallbackLocale = fallback[urlLocale];

	// Get the path for the fallback locale (handles granular locales)
	const pathFallbackLocale = getPathByLocale(fallbackLocale, locales);

	let newPathname: string;

	// If fallback is to the default locale and strategy is prefix-other-locales,
	// remove the locale prefix (default locale has no prefix)
	if (pathFallbackLocale === defaultLocale && strategy === 'pathname-prefix-other-locales') {
		if (pathname.includes(`${base}`)) {
			newPathname = pathname.replace(`/${urlLocale}`, ``);
		} else {
			newPathname = pathname.replace(`/${urlLocale}`, `/`);
		}
	} else {
		// Replace the current locale with the fallback locale
		newPathname = pathname.replace(`/${urlLocale}`, `/${pathFallbackLocale}`);
	}

	return {
		type: fallbackType,
		pathname: newPathname,
	};
}

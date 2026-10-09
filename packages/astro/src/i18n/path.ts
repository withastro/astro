import type { Locales } from '../types/public/config.js';

// Checks if the pathname has any locale
export function pathHasLocale(path: string, locales: Locales): boolean {
	// pages that use a locale param ([locale].astro or [locale]/index.astro)
	// and getStaticPaths make [locale].html the pathname during SSG
	// which will not match a configured locale without removing .html
	// as we do in normalizeThePath
	const segments = path.split('/').map(normalizeThePath);
	for (const segment of segments) {
		for (const locale of locales) {
			if (typeof locale === 'string') {
				if (normalizeTheLocale(segment) === normalizeTheLocale(locale)) {
					return true;
				}
			} else if (segment === locale.path) {
				return true;
			}
		}
	}

	return false;
}

/**
 *
 * Given a locale, this function:
 * - replaces the `_` with a `-`;
 * - transforms all letters to be lowercase;
 */
export function normalizeTheLocale(locale: string): string {
	return locale.replaceAll('_', '-').toLowerCase();
}

/**
 *
 * Given a path or path segment, this function:
 * - removes the `.html` extension if it exists
 */
export function normalizeThePath(path: string): string {
	return path.endsWith('.html') ? path.slice(0, -5) : path;
}

/**
 * Client-safe i18n utility functions.
 * These functions are pure and don't depend on any server-side modules.
 * They are used by the client-side version of the `astro:i18n` virtual module.
 */
export {
	getLocaleRelativeUrl,
	getLocaleAbsoluteUrl,
	getLocaleRelativeUrlList,
	getLocaleAbsoluteUrlList,
	getPathByLocale,
	getLocaleByPath,
	pathHasLocale,
	normalizeTheLocale,
	toCodes,
	toPaths,
} from '../i18n/index.js';

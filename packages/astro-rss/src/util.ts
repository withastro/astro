import type { RSSOptions } from './index.js';

/** Normalize URL to its canonical form */
export function createCanonicalURL(
	url: string,
	trailingSlash?: RSSOptions['trailingSlash'],
	base?: string,
): string {
	// Only the path is normalized: a slash appended after a query string or hash would change its value
	const suffixIndex = url.search(/[?#]/);
	const suffix = suffixIndex === -1 ? '' : url.slice(suffixIndex);
	let pathname = suffixIndex === -1 ? url : url.slice(0, suffixIndex);

	pathname = pathname.replace(/\/index.html$/, ''); // index.html is not canonical
	if (!getUrlExtension(pathname)) {
		// add trailing slash if there’s no extension or `trailingSlash` is true
		pathname = pathname.replace(/\/*$/, '/');
	}

	pathname = pathname.replace(/\/+/g, '/'); // remove duplicate slashes (URL() won’t)

	const canonicalUrl = new URL(pathname, base).href;
	if (trailingSlash === false) {
		// remove the trailing slash
		return canonicalUrl.replace(/\/*$/, '') + suffix;
	}
	return canonicalUrl + suffix;
}

/** Check if a URL is already valid */
export function isValidURL(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {}
	return false;
}

function getUrlExtension(url: string) {
	const lastDot = url.lastIndexOf('.');
	const lastSlash = url.lastIndexOf('/');
	return lastDot > lastSlash ? url.slice(lastDot + 1) : '';
}

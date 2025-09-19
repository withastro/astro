/**
 * A set of common path utilities commonly used through the Astro core and integration
 * projects. These do things like ensure a forward slash prepends paths.
 */

export function appendExtension(path: string, extension: string) {
	return path + '.' + extension;
}

export function appendForwardSlash(path: string) {
	return path.endsWith('/') ? path : path + '/';
}

export function prependForwardSlash(path: string) {
	return path[0] === '/' ? path : '/' + path;
}

export function collapseDuplicateSlashes(path: string) {
	return path.replace(/(?<!:)\/{2,}/g, '/');
}

export const MANY_TRAILING_SLASHES = /\/{2,}$/g;

export function collapseDuplicateTrailingSlashes(path: string, trailingSlash: boolean) {
	if (!path) {
		return path;
	}
	return path.replace(MANY_TRAILING_SLASHES, trailingSlash ? '/' : '') || '/';
}

export function removeTrailingForwardSlash(path: string) {
	return path.endsWith('/') ? path.slice(0, path.length - 1) : path;
}

export function removeLeadingForwardSlash(path: string) {
	return path.startsWith('/') ? path.substring(1) : path;
}

export function removeLeadingForwardSlashWindows(path: string) {
	return path.startsWith('/') && path[2] === ':' ? path.substring(1) : path;
}

export function trimSlashes(path: string) {
	return path.replace(/^\/|\/$/g, '');
}

export function startsWithForwardSlash(path: string) {
	return path[0] === '/';
}

export function startsWithDotDotSlash(path: string) {
	const c1 = path[0];
	const c2 = path[1];
	const c3 = path[2];
	return c1 === '.' && c2 === '.' && c3 === '/';
}

export function startsWithDotSlash(path: string) {
	const c1 = path[0];
	const c2 = path[1];
	return c1 === '.' && c2 === '/';
}

export function isRelativePath(path: string) {
	return startsWithDotDotSlash(path) || startsWithDotSlash(path);
}

function isString(path: unknown): path is string {
	return typeof path === 'string' || path instanceof String;
}

const INTERNAL_PREFIXES = new Set(['/_', '/@', '/.', '//']);
const JUST_SLASHES = /^\/{2,}$/;

export function isInternalPath(path: string) {
	return INTERNAL_PREFIXES.has(path.slice(0, 2)) && !JUST_SLASHES.test(path);
}

export function joinPaths(...paths: (string | undefined)[]) {
	return paths
		.filter(isString)
		.map((path, i) => {
			if (i === 0) {
				return removeTrailingForwardSlash(path);
			} else if (i === paths.length - 1) {
				return removeLeadingForwardSlash(path);
			} else {
				return trimSlashes(path);
			}
		})
		.join('/');
}

export function removeFileExtension(path: string) {
	let idx = path.lastIndexOf('.');
	return idx === -1 ? path : path.slice(0, idx);
}

export function removeQueryString(path: string) {
	const index = path.lastIndexOf('?');
	return index > 0 ? path.substring(0, index) : path;
}

/**
 * Regex that matches the following URLs like:
 * - http://example.com
 * - https://example.com
 * - ftp://example.com
 * - ws://example.com
 * - //example.com (protocol-relative URLs)
 */
const URL_PROTOCOL_REGEX = /^(?:(?:http|ftp|https|ws):?\/\/|\/\/)/;

/**
 * Checks whether the path is considered a remote path. Paths need to start with:
 * - `http://`
 * - `https://`
 * - `ftp://`
 * - `ws://`
 * - `//` (protocol-relative URLs)
 * - `data:` (base64 images)
 * - Backslash variants (e.g., `\\example.com`) that could normalize to remote URLs
 * - URL-encoded backslash variants (e.g., `%5C%5Cexample.com`)
 * @param src
 */
export function isRemotePath(src: string) {
	// First decode any URL-encoded backslashes
	const decoded = src.replace(/%5C/gi, '\\');
	
	// Check for any backslash at the start (single or multiple)
	// These can be normalized to protocol-relative URLs
	if (decoded[0] === '\\') {
		return true;
	}
	
	// Check for protocols with backslashes (e.g., http:\\ or https:\\)
	if (/^(?:http|https|ftp|ws):\\/.test(decoded)) {
		return true;
	}
	
	// Check standard URL patterns
	return URL_PROTOCOL_REGEX.test(decoded) || decoded.startsWith('data:');
}

export function slash(path: string) {
	return path.replace(/\\/g, '/');
}

export function fileExtension(path: string) {
	const ext = path.split('.').pop();
	return ext !== path ? `.${ext}` : '';
}

export function removeBase(path: string, base: string) {
	if (path.startsWith(base)) {
		return path.slice(removeTrailingForwardSlash(base).length);
	}
	return path;
}

const WITH_FILE_EXT = /\/[^/]+\.\w+$/;

export function hasFileExtension(path: string) {
	return WITH_FILE_EXT.test(path);
}

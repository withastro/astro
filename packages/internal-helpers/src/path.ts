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

function startsWithDotDotSlash(path: string) {
	const c1 = path[0];
	const c2 = path[1];
	const c3 = path[2];
	return c1 === '.' && c2 === '.' && c3 === '/';
}

function startsWithDotSlash(path: string) {
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
 * Checks whether the path is considered a remote path.
 * Remote means untrusted in this context, so anything that isn't a straightforward
 * local path is considered remote.
 *
 * @param src
 */
export function isRemotePath(src: string) {
	if (!src) return false;

	// Trim leading/trailing whitespace
	const trimmed = src.trim();
	if (!trimmed) return false;

	// Recursively decode URL-encoded characters to catch multi-level obfuscation
	let decoded = trimmed;
	let previousDecoded = '';
	let maxIterations = 10; // Prevent infinite loops on malformed input

	while (decoded !== previousDecoded && maxIterations > 0) {
		previousDecoded = decoded;
		try {
			decoded = decodeURIComponent(decoded);
		} catch {
			// If decoding fails (e.g., invalid %), stop and use what we have
			break;
		}
		maxIterations--;
	}

	// Check for Windows paths first (C:\, D:\, C:file, etc.)
	// This needs to be before the backslash check
	if (/^[a-zA-Z]:/.test(decoded)) {
		// Windows path with drive letter - always local
		return false;
	}

	// Check for Unix absolute path (starts with / but not // or /\)
	// This needs to be before the backslash check
	if (decoded[0] === '/' && decoded[1] !== '/' && decoded[1] !== '\\') {
		return false;
	}

	// Any backslash at the start is probably trouble. Treat as remote.
	if (decoded[0] === '\\') {
		return true;
	}

	// Protocol-relative URLs are remote
	if (decoded.startsWith('//')) {
		return true;
	}

	// Try to parse as URL to check for protocols and credentials
	try {
		// Try with a mock base URL for relative URLs that might have protocols
		const url = new URL(decoded, 'http://n');
		// Check for credentials first - ANY URL with credentials is suspicious
		if (url.username || url.password) {
			return true;
		}

		if (decoded.includes('@') && !url.pathname.includes('@') && !url.search.includes('@')) {
			// If the original string had an @ but it wasn't in the pathname or search,
			// it must have been in the authority section (credentials or domain).
			// Since we already checked for credentials, this is something dodgy.
			return true;
		}
		// If the input had its own protocol, it would override the base
		if (url.origin !== 'http://n') {
			// It had its own protocol - check what it is
			const protocol = url.protocol.toLowerCase();

			// Only file: protocol without credentials is considered local
			if (protocol === 'file:') {
				return false;
			}
			// All other protocols are remote (http:, https:, ftp:, ws:, data:, etc.)
			return true;
		}
		// If we can parse it both with and without a base URL, it's probably remote
		if (URL.canParse(decoded)) {
			return true;
		}
		return false;
	} catch {
		return true;
	}
}

/**
 * Checks if parentPath is a parent directory of childPath.
 */
export function isParentDirectory(parentPath: string, childPath: string): boolean {
	if (!parentPath || !childPath) {
		return false;
	}

	// Reject any URLs
	if (parentPath.includes('://') || childPath.includes('://')) {
		return false;
	}

	// Reject remote or suspicious paths
	if (isRemotePath(parentPath) || isRemotePath(childPath)) {
		return false;
	}

	// Don't allow any .. in paths - too risky for traversal attacks
	if (parentPath.includes('..') || childPath.includes('..')) {
		return false;
	}

	// Reject null bytes - security risk
	if (parentPath.includes('\0') || childPath.includes('\0')) {
		return false;
	}

	const normalizedParent = appendForwardSlash(slash(parentPath).toLowerCase());
	const normalizedChild = slash(childPath).toLowerCase();

	// Don't allow same path (parent can't be parent of itself)
	if (normalizedParent === normalizedChild || normalizedParent === normalizedChild + '/') {
		return false;
	}

	return normalizedChild.startsWith(normalizedParent);
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

/**
 * Normalizes a URL pathname to match the canonical form used by route generation.
 * This reverses the transformations done by `getUrlForPath` in generate.ts.
 *
 * - For `buildFormat: 'file'`: strips `.html` extension
 * - For `buildFormat: 'directory'/'preserve'` with `trailingSlash: 'ignore'`: strips trailing slash
 *
 * @param pathname - The URL pathname to normalize
 * @param buildFormat - The build format ('file', 'directory', or 'preserve')
 * @param trailingSlash - The trailing slash setting ('always', 'never', or 'ignore')
 */
export function normalizePathname(
	pathname: string,
	buildFormat: 'file' | 'directory' | 'preserve',
	trailingSlash: 'always' | 'never' | 'ignore',
): string {
	if (buildFormat === 'file') {
		// Strip .html extension (but not for root like /.html)
		if (pathname.endsWith('.html') && pathname !== '/.html') {
			return pathname.slice(0, -5);
		}
		// Handle edge case: index page with base gets mangled by removeBase
		// e.g., /blog.html with base /blog → removeBase gives /html (missing the dot)
		// In file format, all non-index paths should end with .html, so if it doesn't
		// and it's not root, it's likely a mangled index pathname
		if (pathname !== '/' && !pathname.endsWith('.html')) {
			return '/';
		}
	} else {
		// directory or preserve format
		// Strip trailing slash when trailingSlash is 'ignore'
		// (because getUrlForPath adds it, but getRouteGenerator doesn't)
		if (trailingSlash === 'ignore' && pathname.endsWith('/') && pathname !== '/') {
			return pathname.slice(0, -1);
		}
	}
	return pathname;
}

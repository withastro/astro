function appendExtension(path, extension) {
	return path + '.' + extension;
}
function appendForwardSlash(path) {
	return path.endsWith('/') ? path : path + '/';
}
function prependForwardSlash(path) {
	return path[0] === '/' ? path : '/' + path;
}
const MANY_LEADING_SLASHES = /^\/{2,}/;
function collapseDuplicateLeadingSlashes(path) {
	if (!path) {
		return path;
	}
	return path.replace(MANY_LEADING_SLASHES, '/');
}
const MANY_SLASHES = /\/{2,}/g;
function collapseDuplicateSlashes(path) {
	if (!path) {
		return path;
	}
	return path.replace(MANY_SLASHES, '/');
}
const MANY_TRAILING_SLASHES = /\/{2,}$/g;
function collapseDuplicateTrailingSlashes(path, trailingSlash) {
	if (!path) {
		return path;
	}
	return path.replace(MANY_TRAILING_SLASHES, trailingSlash ? '/' : '') || '/';
}
function removeTrailingForwardSlash(path) {
	return path.endsWith('/') ? path.slice(0, path.length - 1) : path;
}
function removeLeadingForwardSlash(path) {
	return path.startsWith('/') ? path.substring(1) : path;
}
function removeLeadingForwardSlashWindows(path) {
	return path.startsWith('/') && path[2] === ':' ? path.substring(1) : path;
}
function trimSlashes(path) {
	return path.replace(/^\/|\/$/g, '');
}
function startsWithDotDotSlash(path) {
	const c1 = path[0];
	const c2 = path[1];
	const c3 = path[2];
	return c1 === '.' && c2 === '.' && c3 === '/';
}
function startsWithDotSlash(path) {
	const c1 = path[0];
	const c2 = path[1];
	return c1 === '.' && c2 === '/';
}
function isRelativePath(path) {
	return startsWithDotDotSlash(path) || startsWithDotSlash(path);
}
function isString(path) {
	return typeof path === 'string' || path instanceof String;
}
const INTERNAL_PREFIXES = /* @__PURE__ */ new Set(['/_', '/@', '/.', '//']);
const JUST_SLASHES = /^\/{2,}$/;
function isInternalPath(path) {
	return INTERNAL_PREFIXES.has(path.slice(0, 2)) && !JUST_SLASHES.test(path);
}
function joinPaths(...paths) {
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
function removeFileExtension(path) {
	let idx = path.lastIndexOf('.');
	return idx === -1 ? path : path.slice(0, idx);
}
function removeQueryString(path) {
	const index = path.lastIndexOf('?');
	return index > 0 ? path.substring(0, index) : path;
}
function isRemotePath(src) {
	if (!src) return false;
	const trimmed = src.trim();
	if (!trimmed) return false;
	let decoded = trimmed;
	let previousDecoded = '';
	let maxIterations = 10;
	while (decoded !== previousDecoded && maxIterations > 0) {
		previousDecoded = decoded;
		try {
			decoded = decodeURIComponent(decoded);
		} catch {
			break;
		}
		maxIterations--;
	}
	if (/^[a-zA-Z]:/.test(decoded)) {
		return false;
	}
	if (decoded[0] === '/' && /^\/[\w.@-]/.test(decoded)) {
		return false;
	}
	if (decoded[0] === '\\') {
		return true;
	}
	if (decoded.startsWith('//')) {
		return true;
	}
	try {
		const url = new URL(decoded, 'http://n');
		if (url.username || url.password) {
			return true;
		}
		if (decoded.includes('@') && !url.pathname.includes('@') && !url.search.includes('@')) {
			return true;
		}
		if (url.origin !== 'http://n') {
			const protocol = url.protocol.toLowerCase();
			if (protocol === 'file:') {
				return false;
			}
			return true;
		}
		if (URL.canParse(decoded)) {
			return true;
		}
		return false;
	} catch {
		return true;
	}
}
function isParentDirectory(parentPath, childPath) {
	if (!parentPath || !childPath) {
		return false;
	}
	if (parentPath.includes('://') || childPath.includes('://')) {
		return false;
	}
	if (isRemotePath(parentPath) || isRemotePath(childPath)) {
		return false;
	}
	if (parentPath.includes('..') || childPath.includes('..')) {
		return false;
	}
	if (parentPath.includes('\0') || childPath.includes('\0')) {
		return false;
	}
	const normalizedParent = appendForwardSlash(slash(parentPath).toLowerCase());
	const normalizedChild = slash(childPath).toLowerCase();
	if (normalizedParent === normalizedChild || normalizedParent === normalizedChild + '/') {
		return false;
	}
	return normalizedChild.startsWith(normalizedParent);
}
function slash(path) {
	return path.replace(/\\/g, '/');
}
function fileExtension(path) {
	const ext = path.split('.').pop();
	return ext !== path ? `.${ext}` : '';
}
function removeBase(path, base) {
	if (path.startsWith(base)) {
		return path.slice(removeTrailingForwardSlash(base).length);
	}
	return path;
}
const WITH_FILE_EXT = /\/[^/]+\.\w+$/;
function hasFileExtension(path) {
	return WITH_FILE_EXT.test(path);
}
function normalizePathname(pathname, buildFormat, trailingSlash) {
	if (buildFormat === 'file') {
		if (pathname.endsWith('.html') && pathname !== '/.html') {
			return pathname.slice(0, -5);
		}
		if (pathname !== '/' && !pathname.endsWith('.html')) {
			return '/';
		}
	} else {
		if (trailingSlash === 'ignore' && pathname.endsWith('/') && pathname !== '/') {
			return pathname.slice(0, -1);
		}
	}
	return pathname;
}
export {
	MANY_LEADING_SLASHES,
	MANY_TRAILING_SLASHES,
	appendExtension,
	appendForwardSlash,
	collapseDuplicateLeadingSlashes,
	collapseDuplicateSlashes,
	collapseDuplicateTrailingSlashes,
	fileExtension,
	hasFileExtension,
	isInternalPath,
	isParentDirectory,
	isRelativePath,
	isRemotePath,
	joinPaths,
	normalizePathname,
	prependForwardSlash,
	removeBase,
	removeFileExtension,
	removeLeadingForwardSlash,
	removeLeadingForwardSlashWindows,
	removeQueryString,
	removeTrailingForwardSlash,
	slash,
	trimSlashes,
};

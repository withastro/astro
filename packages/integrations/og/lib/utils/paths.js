export function isRemoteImage(src) {
	return /^(https?:)?\/\//.test(src);
}

function removeQueryString(src) {
	const index = src.lastIndexOf('?');
	return index > 0 ? src.substring(0, index) : src;
}

export function extname(src) {
	const base = basename(src);
	const index = base.lastIndexOf('.');

	if (index <= 0) {
		return '';
	}

	return base.substring(index);
}

function basename(src) {
	return removeQueryString(src.replace(/^.*[\\\/]/, ''));
}

export function appendForwardSlash(path) {
	return path.endsWith('/') ? path : path + '/';
}

export function prependForwardSlash(path) {
	return path[0] === '/' ? path : '/' + path;
}

export function removeTrailingForwardSlash(path) {
	return path.endsWith('/') ? path.slice(0, path.length - 1) : path;
}

export function removeLeadingForwardSlash(path) {
	return path.startsWith('/') ? path.substring(1) : path;
}

export function trimSlashes(path) {
	return path.replace(/^\/|\/$/g, '');
}

function isString(path) {
	return typeof path === 'string' || path instanceof String;
}

export function joinPaths(...paths) {
	return paths.filter(isString).map(trimSlashes).join('/');
}

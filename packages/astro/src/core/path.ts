export function appendForwardSlash(path: string) {
	return path.endsWith('/') ? path : path + '/';
}

export function prependForwardSlash(path: string) {
	return path[0] === '/' ? path : '/' + path;
}

export function removeTrailingForwardSlash(path: string) {
	return path.endsWith('/') ? path.slice(0, path.length - 1) : path;
}

export function removeLeadingForwardSlash(path: string) {
	return path.startsWith('/') ? path.substring(1) : path;
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

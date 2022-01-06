
export function appendForwardSlash(path: string) {
  return path.endsWith('/') ? path : path + '/';
}

export function prependForwardSlash(path: string) {
	return path[0] === '/' ? path : '/' + path;
}

export function prependDotSlash(path: string) {
	return path[0] === '.' ? path : './' + path;
}

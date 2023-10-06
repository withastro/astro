export function prependForwardSlash(path: string) {
	return path[0] === '/' ? path : '/' + path;
}

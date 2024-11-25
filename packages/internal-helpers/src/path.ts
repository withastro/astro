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

export function isRemotePath(src: string) {
	return /^(?:http|ftp|https|ws):?\/\//.test(src) || src.startsWith('data:');
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

/**
 * Node-free implementation of node's `fileURLToPath` function.
 * @see https://github.com/bevry/file-url-to-path
 */
export function fileURLToPath(href: string, separator = '/'): string {
	// conform with Node.js fileURLToPath
	if (!href.includes(':/')) {
		const error = new Error('Invalid URL') as any;
		error.code = 'ERR_INVALID_URL';
		throw error;
	}
	if (!href.startsWith('file:')) {
		const error = new Error('The URL must be of scheme file') as any;
		error.code = 'ERR_INVALID_URL_SCHEME';
		throw error;
	}

	// https://en.wikipedia.org/wiki/File_URI_scheme#Examples
	// https://nodejs.org/api/url.html#urlfileurltopathurl
	// file:/path (no hostname)
	// file://hostname/path
	// file:///path (empty hostname)
	let file;
	if (separator === '\\') {
		// is windows
		if (href.startsWith('file:///')) {
			// is full path, e.g. file:///foo
			file = href.substring(8);
			if (file[1] !== ':') {
				const error = new Error('File URL path must be absolute') as any;
				error.code = 'ERR_INVALID_FILE_URL_PATH';
				throw error;
			}
		} else if (href.startsWith('file://localhost/')) {
			// is localhost path, e.g. file://localhost/foo
			// conform with Node.js fileURLToPath
			file = href.substring(17); // trim leading slash
			if (file[1] !== ':') {
				const error = new Error('File URL path must be absolute') as any;
				error.code = 'ERR_INVALID_FILE_URL_PATH';
				throw error;
			}
		} else if (href.startsWith('file://')) {
			// is host path, e.g. file://hostname/foo
			// conform with Node.js fileURLToPath, which does not error
			file = href.substring(7);
			file = separator + separator + file;
		} else if (href.startsWith('file:/')) {
			// is full path with unknown drive letter
			// conform with Node.js fileURLToPath
			file = href.substring(6);
			if (file[1] !== ':') {
				const error = new Error('File URL path must be absolute') as any;
				error.code = 'ERR_INVALID_FILE_URL_PATH';
				throw error;
			}
		} else {
			file = href;
		}

		// replace slashes with backslashes
		file = file.replace(/\//g, separator);
	} else if (separator === '/') {
		// is posix
		if (href.startsWith('file:///')) {
			// is full path, e.g. file:///foo
			file = href.substring(7); // keep leading slash
		} else if (href.startsWith('file://')) {
			// is host path, e.g. file://localhost/foo
			if (!href.startsWith('file://localhost/')) {
				const error = new Error('File URL host must be "localhost" or empty') as any;
				error.code = 'ERR_INVALID_FILE_URL_HOST';
				throw error;
			}
			file = href.substring(16); // keep leading slash
		} else if (href.startsWith('file:/')) {
			// is full path, e.g. file:/foo
			file = href.substring(5); // keep leading slash
		} else {
			file = href;
		}
	} else {
		file = href;
	}
	return file;
}

import npath from 'path-browserify';

/** Normalize URL to its canonical form */
export function createCanonicalURL(url: string, base?: string): URL {
	let pathname = url.replace(/\/index.html$/, ''); // index.html is not canonical
	pathname = pathname.replace(/\/1\/?$/, ''); // neither is a trailing /1/ (impl. detail of collections)
	if (!npath.extname(pathname)) pathname = pathname.replace(/(\/+)?$/, '/'); // add trailing slash if there’s no extension
	pathname = pathname.replace(/\/+/g, '/'); // remove duplicate slashes (URL() won’t)
	return new URL(pathname, base);
}

/** Check if a URL is already valid */
export function isValidURL(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch (e) {}
	return false;
}

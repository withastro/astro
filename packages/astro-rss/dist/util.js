function createCanonicalURL(url, trailingSlash, base) {
	let pathname = url.replace(/\/index.html$/, '');
	if (!getUrlExtension(url)) {
		pathname = pathname.replace(/\/*$/, '/');
	}
	pathname = pathname.replace(/\/+/g, '/');
	const canonicalUrl = new URL(pathname, base).href;
	if (trailingSlash === false) {
		return canonicalUrl.replace(/\/*$/, '');
	}
	return canonicalUrl;
}
function isValidURL(url) {
	try {
		new URL(url);
		return true;
	} catch {}
	return false;
}
function getUrlExtension(url) {
	const lastDot = url.lastIndexOf('.');
	const lastSlash = url.lastIndexOf('/');
	return lastDot > lastSlash ? url.slice(lastDot + 1) : '';
}
export { createCanonicalURL, isValidURL };

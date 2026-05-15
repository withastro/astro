const PLACEHOLDER_BASE = 'astro://placeholder';
function createPlaceholderURL(pathOrUrl) {
	return new URL(pathOrUrl, PLACEHOLDER_BASE);
}
function stringifyPlaceholderURL(url) {
	return url.href.replace(PLACEHOLDER_BASE, '');
}
export { createPlaceholderURL, stringifyPlaceholderURL };

function defaultSetHeaders(options) {
	const headers = new Headers();
	const directives = [];
	if (options.maxAge !== void 0) {
		directives.push(`max-age=${options.maxAge}`);
	}
	if (options.swr !== void 0) {
		directives.push(`stale-while-revalidate=${options.swr}`);
	}
	if (directives.length > 0) {
		headers.set('CDN-Cache-Control', directives.join(', '));
	}
	if (options.tags && options.tags.length > 0) {
		headers.set('Cache-Tag', options.tags.join(', '));
	}
	if (options.lastModified) {
		headers.set('Last-Modified', options.lastModified.toUTCString());
	}
	if (options.etag) {
		headers.set('ETag', options.etag);
	}
	return headers;
}
function isCacheHint(value) {
	return value != null && typeof value === 'object' && 'tags' in value;
}
function isLiveDataEntry(value) {
	return (
		value != null &&
		typeof value === 'object' &&
		'id' in value &&
		'data' in value &&
		'cacheHint' in value
	);
}
export { defaultSetHeaders, isCacheHint, isLiveDataEntry };

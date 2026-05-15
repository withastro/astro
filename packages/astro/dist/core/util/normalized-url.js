import { collapseDuplicateSlashes } from '@astrojs/internal-helpers/path';
import { MultiLevelEncodingError, validateAndDecodePathname } from './pathname.js';
function createNormalizedUrl(requestUrl) {
	return normalizeUrl(new URL(requestUrl));
}
function normalizeUrl(url) {
	try {
		url.pathname = validateAndDecodePathname(url.pathname);
	} catch (e) {
		if (e instanceof MultiLevelEncodingError) {
			throw e;
		}
		try {
			url.pathname = decodeURI(url.pathname);
		} catch {}
	}
	url.pathname = collapseDuplicateSlashes(url.pathname);
	return url;
}
export { createNormalizedUrl, normalizeUrl };

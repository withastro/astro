const ASTRO_PAGE_EXTENSION_POST_PATTERN = '@_@';
const ASTRO_PAGE_KEY_SEPARATOR = '&';
function makePageDataKey(route, componentPath) {
	return route + ASTRO_PAGE_KEY_SEPARATOR + componentPath;
}
function shouldInlineAsset(assetContent, assetPath, assetsInlineLimit) {
	if (typeof assetsInlineLimit === 'function') {
		const result = assetsInlineLimit(assetPath, Buffer.from(assetContent));
		if (result != null) {
			return result;
		} else {
			return Buffer.byteLength(assetContent) < 4096;
		}
	}
	return Buffer.byteLength(assetContent) < Number(assetsInlineLimit);
}
export { ASTRO_PAGE_EXTENSION_POST_PATTERN, makePageDataKey, shouldInlineAsset };

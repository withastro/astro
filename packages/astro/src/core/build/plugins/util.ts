import type { BuildOptions } from 'vite';

// This is an arbitrary string that we use to replace the dot of the extension.
export const ASTRO_PAGE_EXTENSION_POST_PATTERN = '@_@';
// This is an arbitrary string that we use to make a pageData key
// Has to be a invalid character for a route, to avoid conflicts.
const ASTRO_PAGE_KEY_SEPARATOR = '&';

/**
 * Generate a unique key to identify each page in the build process.
 * @param route Usually pageData.route.route
 * @param componentPath Usually pageData.component
 */
export function makePageDataKey(route: string, componentPath: string): string {
	return route + ASTRO_PAGE_KEY_SEPARATOR + componentPath;
}


export function shouldInlineAsset(
	assetContent: string,
	assetPath: string,
	assetsInlineLimit: NonNullable<BuildOptions['assetsInlineLimit']>,
) {
	if (typeof assetsInlineLimit === 'function') {
		const result = assetsInlineLimit(assetPath, Buffer.from(assetContent));
		if (result != null) {
			return result;
		} else {
			return Buffer.byteLength(assetContent) < 4096; // Fallback to 4096kb by default (same as Vite)
		}
	}
	return Buffer.byteLength(assetContent) < Number(assetsInlineLimit);
}

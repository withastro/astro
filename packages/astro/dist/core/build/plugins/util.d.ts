import type { BuildOptions } from 'vite';
export declare const ASTRO_PAGE_EXTENSION_POST_PATTERN = '@_@';
/**
 * Generate a unique key to identify each page in the build process.
 * @param route Usually pageData.route.route
 * @param componentPath Usually pageData.component
 */
export declare function makePageDataKey(route: string, componentPath: string): string;
export declare function shouldInlineAsset(
	assetContent: string,
	assetPath: string,
	assetsInlineLimit: NonNullable<BuildOptions['assetsInlineLimit']>,
): boolean;

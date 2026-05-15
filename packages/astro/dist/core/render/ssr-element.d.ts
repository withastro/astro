import type { SSRElement } from '../../types/public/internal.js';
import type { AssetsPrefix, StylesheetAsset } from '../app/types.js';
export declare function createAssetLink(
	href: string,
	base?: string,
	assetsPrefix?: AssetsPrefix,
	queryParams?: URLSearchParams,
): string;
export declare function createStylesheetElementSet(
	stylesheets: StylesheetAsset[],
	base?: string,
	assetsPrefix?: AssetsPrefix,
	queryParams?: URLSearchParams,
): Set<SSRElement>;
export declare function createModuleScriptElement(
	script: {
		type: 'inline' | 'external';
		value: string;
	},
	base?: string,
	assetsPrefix?: AssetsPrefix,
	queryParams?: URLSearchParams,
): SSRElement;

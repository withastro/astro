import type { AstroLogger } from '../../../core/logger/core.js';
import type { FontFamilyAssetsByUniqueKey, ResolvedFontFamily } from '../types.js';
export declare function getOrCreateFontFamilyAssets({
	fontFamilyAssetsByUniqueKey,
	logger,
	bold,
	family,
}: {
	fontFamilyAssetsByUniqueKey: FontFamilyAssetsByUniqueKey;
	logger: AstroLogger;
	bold: (input: string) => string;
	family: ResolvedFontFamily;
}): import('../types.js').FontFamilyAssets;

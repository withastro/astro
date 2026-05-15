import type { AstroLogger } from '../../../core/logger/core.js';
import type { FontResolver, StringMatcher } from '../definitions.js';
import type { Collaborator, Defaults, FontFileById, ResolvedFontFamily } from '../types.js';
import type { collectFontAssetsFromFaces as _collectFontAssetsFromFaces } from './collect-font-assets-from-faces.js';
import type { filterAndTransformFontFaces as _filterAndTransformFontFaces } from './filter-and-transform-font-faces.js';
import type { getOrCreateFontFamilyAssets as _getOrCreateFontFamilyAssets } from './get-or-create-font-family-assets.js';
export declare function computeFontFamiliesAssets({
	resolvedFamilies,
	fontResolver,
	logger,
	bold,
	defaults,
	stringMatcher,
	getOrCreateFontFamilyAssets,
	collectFontAssetsFromFaces,
	filterAndTransformFontFaces,
}: {
	resolvedFamilies: Array<ResolvedFontFamily>;
	fontResolver: FontResolver;
	logger: AstroLogger;
	bold: (input: string) => string;
	defaults: Defaults;
	stringMatcher: StringMatcher;
	getOrCreateFontFamilyAssets: Collaborator<
		typeof _getOrCreateFontFamilyAssets,
		'family' | 'fontFamilyAssetsByUniqueKey'
	>;
	filterAndTransformFontFaces: Collaborator<
		typeof _filterAndTransformFontFaces,
		'family' | 'fonts'
	>;
	collectFontAssetsFromFaces: Collaborator<
		typeof _collectFontAssetsFromFaces,
		'family' | 'fonts' | 'collectedFontsIds' | 'fontFilesIds'
	>;
}): Promise<{
	fontFamilyAssets: import('../types.js').FontFamilyAssets[];
	fontFileById: FontFileById;
}>;

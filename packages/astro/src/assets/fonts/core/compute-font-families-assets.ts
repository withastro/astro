import type { Logger } from '../../../core/logger/core.js';
import type { FontResolver, StringMatcher } from '../definitions.js';
import type {
	Collaborator,
	Defaults,
	FontFamilyAssetsByUniqueKey,
	FontFileById,
	ResolvedFontFamily,
} from '../types.js';
import type { collectFontAssetsFromFaces as _collectFontAssetsFromFaces } from './collect-font-assets-from-faces.js';
import type { filterAndTransformFontFaces as _filterAndTransformFontFaces } from './filter-and-transform-font-faces.js';
import type { getOrCreateFontFamilyAssets as _getOrCreateFontFamilyAssets } from './get-or-create-font-family-assets.js';

export async function computeFontFamiliesAssets({
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
	logger: Logger;
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
}) {
	/**
	 * Holds family data by a key, to allow merging families
	 */
	const fontFamilyAssetsByUniqueKey: FontFamilyAssetsByUniqueKey = new Map();

	/**
	 * Holds associations of id and original font file URLs, so they can be
	 * downloaded whenever the id is requested.
	 */
	const fontFileById: FontFileById = new Map();

	// First loop: we try to merge families. This is useful for advanced cases, where eg. you want
	// 500, 600, 700 as normal but also 500 as italic. That requires 2 families
	for (const family of resolvedFamilies) {
		const fontAssets = getOrCreateFontFamilyAssets({
			fontFamilyAssetsByUniqueKey,
			family,
		});

		const _fonts = await fontResolver.resolveFont({
			familyName: family.name,
			provider: family.provider,
			// We do not merge the defaults, we only provide defaults as a fallback
			weights: family.weights ?? defaults.weights,
			styles: family.styles ?? defaults.styles,
			subsets: family.subsets ?? defaults.subsets,
			formats: family.formats ?? defaults.formats,
			options: family.options,
		});
		if (_fonts.length === 0) {
			logger.warn(
				'assets',
				`No data found for font family ${bold(family.name)}. Review your configuration`,
			);
			const availableFamilies = await fontResolver.listFonts({ provider: family.provider });
			if (
				availableFamilies &&
				availableFamilies.length > 0 &&
				!availableFamilies.includes(family.name)
			) {
				logger.warn(
					'assets',
					`${bold(family.name)} font family cannot be retrieved by the provider. Did you mean ${bold(stringMatcher.getClosestMatch(family.name, availableFamilies))}?`,
				);
			}
			continue;
		}
		// The data returned by the provider contains original URLs. We proxy them.
		// TODO: dedupe?
		fontAssets.fonts.push(
			...filterAndTransformFontFaces({
				fonts: _fonts,
				family,
			}),
		);

		const result = collectFontAssetsFromFaces({
			fonts: fontAssets.fonts,
			family,
			fontFilesIds: new Set(fontFileById.keys()),
			collectedFontsIds: new Set(fontAssets.collectedFontsForMetricsByUniqueKey.keys()),
		});
		for (const [key, value] of result.fontFileById.entries()) {
			fontFileById.set(key, value);
		}
		for (const [key, value] of result.collectedFontsForMetricsByUniqueKey.entries()) {
			fontAssets.collectedFontsForMetricsByUniqueKey.set(key, value);
		}
		fontAssets.preloads.push(...result.preloads);
	}

	return { fontFamilyAssets: Array.from(fontFamilyAssetsByUniqueKey.values()), fontFileById };
}

import type { Logger } from '../../core/logger/core.js';
import { collectFontAssetsFromFaces } from './core/collect-font-assets-from-faces.js';
import { filterAndTransformFontFaces } from './core/filter-and-transform-font-faces.js';
import { getOrCreateFontFamilyAssets } from './core/get-or-create-font-family-assets.js';
import { optimizeFallbacks } from './core/optimize-fallbacks.js';
import { resolveFamily } from './core/resolve-family.js';
import type {
	CssRenderer,
	FontFileIdGenerator,
	FontMetricsResolver,
	FontResolver,
	FontTypeExtractor,
	Hasher,
	StringMatcher,
	SystemFallbacksProvider,
	UrlResolver,
} from './definitions.js';
import type {
	ConsumableMap,
	Defaults,
	FontData,
	FontFamily,
	FontFamilyAssetsByUniqueKey,
	FontFileById,
	InternalConsumableMap,
	ResolvedFontFamily,
} from './types.js';
import { renderFontWeight, unifontFontFaceDataToProperties } from './utils.js';

async function resolveFamilies({
	resolvedFamilies,
	fontResolver,
	logger,
	bold,
	defaults,
	stringMatcher,
	fontTypeExtractor,
	fontFileIdGenerator,
	urlResolver,
	hasher,
}: {
	resolvedFamilies: Array<ResolvedFontFamily>;
	fontResolver: FontResolver;
	logger: Logger;
	bold: (input: string) => string;
	defaults: Defaults;
	stringMatcher: StringMatcher;
	fontTypeExtractor: FontTypeExtractor;
	fontFileIdGenerator: FontFileIdGenerator;
	urlResolver: UrlResolver;
	hasher: Hasher;
}) {
	/**
	 * Holds family data by a key, to allow merging families
	 */
	const fontFamilyAssetsByUniqueKey: FontFamilyAssetsByUniqueKey = new Map();

	/**
	 * Holds associations of hash and original font file URLs, so they can be
	 * downloaded whenever the hash is requested.
	 */
	const fontFileById: FontFileById = new Map();

	// First loop: we try to merge families. This is useful for advanced cases, where eg. you want
	// 500, 600, 700 as normal but also 500 as italic. That requires 2 families
	for (const family of resolvedFamilies) {
		const fontAssets = getOrCreateFontFamilyAssets({
			fontFamilyAssetsByUniqueKey,
			bold,
			family,
			logger,
		});

		const fonts = await fontResolver.resolveFont({
			familyName: family.name,
			provider: family.provider.name,
			// We do not merge the defaults, we only provide defaults as a fallback
			weights: family.weights ?? defaults.weights,
			styles: family.styles ?? defaults.styles,
			subsets: family.subsets ?? defaults.subsets,
			formats: family.formats ?? defaults.formats,
			options: family.options,
		});
		if (fonts.length === 0) {
			logger.warn(
				'assets',
				`No data found for font family ${bold(family.name)}. Review your configuration`,
			);
			const availableFamilies = await fontResolver.listFonts({ provider: family.provider.name });
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
		}
		// The data returned by the provider contains original URLs. We proxy them.
		fontAssets.fonts = filterAndTransformFontFaces({
			fonts,
			family,
			fontFileIdGenerator,
			fontTypeExtractor,
			urlResolver,
		});

		const result = collectFontAssetsFromFaces({
			fonts,
			family,
			fontFileIdGenerator,
			fontFilesIds: new Set(fontFileById.keys()),
			collectedFontsIds: new Set(fontAssets.collectedFontsForMetricsByUniqueKey.keys()),
			hasher,
		});
		for (const [key, value] of result.fontFileById.entries()) {
			fontFileById.set(key, value);
		}
		for (const [key, value] of result.collectedFontsForMetricsByUniqueKey.entries()) {
			fontAssets.collectedFontsForMetricsByUniqueKey.set(key, value);
		}
		fontAssets.preloads.push(...result.preloads);
	}

	return { fontFamilyAssetsByUniqueKey, fontFileDataMap: fontFileById };
}

/**
 * Manages how fonts are resolved:
 *
 * - families are resolved
 * - font resolver is initialized
 *
 * For each family:
 * - We create a URL proxy
 * - We resolve the font and normalize the result
 *
 * For each resolved font:
 * - We generate the CSS font face
 * - We generate optimized fallbacks if applicable
 * - We generate CSS variables
 *
 * Once that's done, the collected data is returned
 */
export async function orchestrate({
	families,
	hasher,
	cssRenderer,
	systemFallbacksProvider,
	fontMetricsResolver,
	fontTypeExtractor,
	logger,
	defaults,
	bold,
	stringMatcher,
	createFontResolver,
	fontFileIdGenerator,
	urlResolver,
}: {
	families: Array<FontFamily>;
	hasher: Hasher;
	cssRenderer: CssRenderer;
	systemFallbacksProvider: SystemFallbacksProvider;
	fontMetricsResolver: FontMetricsResolver;
	fontTypeExtractor: FontTypeExtractor;
	logger: Logger;
	defaults: Defaults;
	bold: (input: string) => string;
	stringMatcher: StringMatcher;
	createFontResolver: (params: { families: Array<ResolvedFontFamily> }) => Promise<FontResolver>;
	fontFileIdGenerator: FontFileIdGenerator;
	urlResolver: UrlResolver;
}): Promise<{
	fontFileDataMap: FontFileById;
	internalConsumableMap: InternalConsumableMap;
	consumableMap: ConsumableMap;
}> {
	const resolvedFamilies = families.map((family) => resolveFamily({ family, hasher }));
	const { fontFamilyAssetsByUniqueKey, fontFileDataMap } = await resolveFamilies({
		resolvedFamilies,
		fontResolver: await createFontResolver({ families: resolvedFamilies }),
		logger,
		bold,
		defaults,
		fontFileIdGenerator,
		fontTypeExtractor,
		stringMatcher,
		urlResolver,
		hasher,
	});

	/**
	 * Holds associations of CSS variables and preloadData/css to be passed to the internal virtual module.
	 */
	const internalConsumableMap: InternalConsumableMap = new Map();
	/**
	 * Holds associations of CSS variables and font data to be exposed via virtual module.
	 */
	const consumableMap: ConsumableMap = new Map();

	// We know about all the families, let's generate css, fallbacks and more
	for (const {
		family,
		fonts,
		collectedFontsForMetricsByUniqueKey: collectedFonts,
		preloads,
	} of fontFamilyAssetsByUniqueKey.values()) {
		const consumableMapValue: Array<FontData> = [];
		let css = '';

		for (const data of fonts) {
			css += cssRenderer.generateFontFace(
				family.uniqueName,
				unifontFontFaceDataToProperties({
					src: data.src,
					weight: data.weight,
					style: data.style,
					// User settings override the generated font settings
					display: data.display ?? family.display,
					unicodeRange: data.unicodeRange ?? family.unicodeRange,
					stretch: data.stretch ?? family.stretch,
					featureSettings: data.featureSettings ?? family.featureSettings,
					variationSettings: data.variationSettings ?? family.variationSettings,
				}),
			);

			consumableMapValue.push({
				weight: renderFontWeight(data.weight),
				style: data.style,
				src: data.src
					.filter((src) => 'url' in src)
					.map((src) => ({
						url: src.url,
						format: src.format,
						tech: src.tech,
					})),
			});
		}

		const fallbacks = family.fallbacks ?? defaults.fallbacks;
		const cssVarValues = [family.uniqueName];
		const optimizeFallbacksResult = await optimizeFallbacks({
			family,
			fallbacks,
			collectedFonts: Array.from(collectedFonts.values()),
			enabled: family.optimizedFallbacks ?? defaults.optimizedFallbacks ?? false,
			systemFallbacksProvider,
			fontMetricsResolver,
		});

		if (optimizeFallbacksResult) {
			css += optimizeFallbacksResult.css;
			cssVarValues.push(...optimizeFallbacksResult.fallbacks);
		} else {
			// If there are no optimized fallbacks, we pass the provided fallbacks as is.
			cssVarValues.push(...fallbacks);
		}

		css += cssRenderer.generateCssVariable(family.cssVariable, cssVarValues);

		internalConsumableMap.set(family.cssVariable, { preloadData: preloads, css });
		consumableMap.set(family.cssVariable, consumableMapValue);
	}

	return { fontFileDataMap, internalConsumableMap, consumableMap };
}

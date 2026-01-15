import type { Logger } from '../../core/logger/core.js';
import type { computeFontFamiliesAssets as _computeFontFamiliesAssets } from './core/compute-font-families-assets.js';
import { optimizeFallbacks } from './core/optimize-fallbacks.js';
import { resolveFamily } from './core/resolve-family.js';
import type {
	CssRenderer,
	FontMetricsResolver,
	FontResolver,
	Hasher,
	StringMatcher,
	SystemFallbacksProvider,
} from './definitions.js';
import type {
	Collaborator,
	ConsumableMap,
	Defaults,
	FontData,
	FontFamily,
	FontFileById,
	InternalConsumableMap,
	ResolvedFontFamily,
} from './types.js';
import { renderFontWeight, unifontFontFaceDataToProperties } from './utils.js';

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
	logger,
	defaults,
	bold,
	stringMatcher,
	createFontResolver,
	computeFontFamiliesAssets,
}: {
	families: Array<FontFamily>;
	hasher: Hasher;
	cssRenderer: CssRenderer;
	systemFallbacksProvider: SystemFallbacksProvider;
	fontMetricsResolver: FontMetricsResolver;
	logger: Logger;
	defaults: Defaults;
	bold: (input: string) => string;
	stringMatcher: StringMatcher;
	createFontResolver: (params: { families: Array<ResolvedFontFamily> }) => Promise<FontResolver>;
	computeFontFamiliesAssets: Collaborator<
		typeof _computeFontFamiliesAssets,
		'resolvedFamilies' | 'defaults'
	>;
}): Promise<{
	fontFileById: FontFileById;
	internalConsumableMap: InternalConsumableMap;
	consumableMap: ConsumableMap;
}> {
	const resolvedFamilies = families.map((family) => resolveFamily({ family, hasher }));
	const { fontFamilyAssetsByUniqueKey, fontFileById } = await computeFontFamiliesAssets({
		resolvedFamilies,
		fontResolver: await createFontResolver({ families: resolvedFamilies }),
		logger,
		bold,
		defaults,
		stringMatcher,
		collectFontAssetsFromFaces,
		filterAndTransformFontFaces,
		getOrCreateFontFamilyAssets,
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

	return { fontFileById, internalConsumableMap, consumableMap };
}

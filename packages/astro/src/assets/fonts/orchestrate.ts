import { collectFontData } from './core/collect-font-data.js';
import type { computeFontFamiliesAssets as _computeFontFamiliesAssets } from './core/compute-font-families-assets.js';
import { optimizeFallbacks } from './core/optimize-fallbacks.js';
import { resolveFamily } from './core/resolve-family.js';
import type {
	CssRenderer,
	FontMetricsResolver,
	Hasher,
	SystemFallbacksProvider,
} from './definitions.js';
import type {
	Collaborator,
	ComponentDataByCssVariable,
	Defaults,
	FontDataByCssVariable,
	FontFamily,
	FontFileById,
} from './types.js';
import { unifontFontFaceDataToProperties } from './utils.js';

// TODO: inline in vite plugin
export async function orchestrate({
	families,
	hasher,
	cssRenderer,
	systemFallbacksProvider,
	fontMetricsResolver,
	defaults,
	computeFontFamiliesAssets,
}: {
	families: Array<FontFamily>;
	hasher: Hasher;
	cssRenderer: CssRenderer;
	systemFallbacksProvider: SystemFallbacksProvider;
	fontMetricsResolver: FontMetricsResolver;
	defaults: Defaults;
	computeFontFamiliesAssets: Collaborator<
		typeof _computeFontFamiliesAssets,
		'resolvedFamilies' | 'defaults'
	>;
}): Promise<{
	fontFileById: FontFileById;
	componentDataByCssVariable: ComponentDataByCssVariable;
	fontDataByCssVariable: FontDataByCssVariable;
}> {
	const resolvedFamilies = families.map((family) => resolveFamily({ family, hasher }));
	const { fontFamilyAssetsByUniqueKey, fontFileById } = await computeFontFamiliesAssets({
		resolvedFamilies,
		defaults,
	});
	const fontFamilyAssets = Array.from(fontFamilyAssetsByUniqueKey.values());
	const { fontDataByCssVariable } = collectFontData(fontFamilyAssets);

	/**
	 * Holds associations of CSS variables and preloadData/css to be passed to the internal virtual module.
	 */
	const componentDataByCssVariable: ComponentDataByCssVariable = new Map();

	// We know about all the families, let's generate css, fallbacks and more
	for (const {
		family,
		fonts,
		collectedFontsForMetricsByUniqueKey,
		preloads,
	} of fontFamilyAssetsByUniqueKey.values()) {
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
		}

		const fallbacks = family.fallbacks ?? defaults.fallbacks;
		const cssVarValues = [family.uniqueName];
		const optimizeFallbacksResult = await optimizeFallbacks({
			family,
			fallbacks,
			collectedFonts: Array.from(collectedFontsForMetricsByUniqueKey.values()),
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

		componentDataByCssVariable.set(family.cssVariable, { preloadData: preloads, css });
	}

	return { fontFileById, componentDataByCssVariable, fontDataByCssVariable };
}

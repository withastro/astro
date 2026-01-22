import type { CssRenderer } from '../definitions.js';
import type {
	Collaborator,
	ComponentDataByCssVariable,
	Defaults,
	FontFamilyAssets,
} from '../types.js';
import { unifontFontFaceDataToProperties } from '../utils.js';
import type { optimizeFallbacks as _optimizeFallbacks } from './optimize-fallbacks.js';

export async function collectComponentData({
	fontFamilyAssets,
	cssRenderer,
	defaults,
	optimizeFallbacks,
}: {
	fontFamilyAssets: Array<FontFamilyAssets>;
	cssRenderer: CssRenderer;
	defaults: Pick<Defaults, 'fallbacks' | 'optimizedFallbacks'>;
	optimizeFallbacks: Collaborator<
		typeof _optimizeFallbacks,
		'family' | 'fallbacks' | 'collectedFonts'
	>;
}) {
	const componentDataByCssVariable: ComponentDataByCssVariable = new Map();

	for (const { family, fonts, collectedFontsForMetricsByUniqueKey, preloads } of fontFamilyAssets) {
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
		const optimizeFallbacksResult =
			(family.optimizedFallbacks ?? defaults.optimizedFallbacks)
				? await optimizeFallbacks({
						family,
						fallbacks,
						collectedFonts: Array.from(collectedFontsForMetricsByUniqueKey.values()),
					})
				: null;

		if (optimizeFallbacksResult) {
			css += optimizeFallbacksResult.css;
			cssVarValues.push(...optimizeFallbacksResult.fallbacks);
		} else {
			// If there are no optimized fallbacks, we pass the provided fallbacks as is.
			cssVarValues.push(...fallbacks);
		}

		css += cssRenderer.generateCssVariable(family.cssVariable, cssVarValues);

		componentDataByCssVariable.set(family.cssVariable, { preloads, css });
	}

	return componentDataByCssVariable;
}

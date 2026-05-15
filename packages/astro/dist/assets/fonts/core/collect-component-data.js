import { unifontFontFaceDataToProperties } from '../utils.js';
async function collectComponentData({
	fontFamilyAssets,
	cssRenderer,
	defaults,
	optimizeFallbacks,
}) {
	const componentDataByCssVariable = /* @__PURE__ */ new Map();
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
			cssVarValues.push(...fallbacks);
		}
		css += cssRenderer.generateCssVariable(family.cssVariable, cssVarValues);
		componentDataByCssVariable.set(family.cssVariable, { preloads, css });
	}
	return componentDataByCssVariable;
}
export { collectComponentData };

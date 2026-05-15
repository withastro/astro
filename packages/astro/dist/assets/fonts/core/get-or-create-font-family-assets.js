function getOrCreateFontFamilyAssets({ fontFamilyAssetsByUniqueKey, logger, bold, family }) {
	const key = `${family.cssVariable}:${family.name}:${family.provider.name}`;
	let fontAssets = fontFamilyAssetsByUniqueKey.get(key);
	if (!fontAssets) {
		if (
			Array.from(fontFamilyAssetsByUniqueKey.keys()).find((k) =>
				k.startsWith(`${family.cssVariable}:`),
			)
		) {
			logger.warn(
				'assets',
				`Several font families have been registered for the ${bold(family.cssVariable)} cssVariable but they do not share the same name and provider.`,
			);
			logger.warn(
				'assets',
				'These families will not be merged together. The last occurrence will override previous families for this cssVariable. Review your Astro configuration.',
			);
		}
		fontAssets = {
			family,
			fonts: [],
			collectedFontsForMetricsByUniqueKey: /* @__PURE__ */ new Map(),
			preloads: [],
		};
		fontFamilyAssetsByUniqueKey.set(key, fontAssets);
	}
	return fontAssets;
}
export { getOrCreateFontFamilyAssets };

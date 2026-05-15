import { isGenericFontFamily, unifontFontFaceDataToProperties } from '../utils.js';
async function optimizeFallbacks({
	family,
	fallbacks: _fallbacks,
	collectedFonts,
	systemFallbacksProvider,
	fontMetricsResolver,
}) {
	let fallbacks = [..._fallbacks];
	if (fallbacks.length === 0 || collectedFonts.length === 0) {
		return null;
	}
	const lastFallback = fallbacks[fallbacks.length - 1];
	if (!isGenericFontFamily(lastFallback)) {
		return null;
	}
	const localFonts = systemFallbacksProvider.getLocalFonts(lastFallback);
	if (!localFonts || localFonts.length === 0) {
		return null;
	}
	if (localFonts.includes(family.name)) {
		return null;
	}
	const localFontsMappings = localFonts.map((font) => ({
		font,
		// We mustn't wrap in quote because that's handled by the CSS renderer
		name: `${family.uniqueName} fallback: ${font}`,
	}));
	fallbacks = [...localFontsMappings.map((m) => m.name), ...fallbacks];
	let css = '';
	for (const { font, name } of localFontsMappings) {
		for (const collected of collectedFonts) {
			css += fontMetricsResolver.generateFontFace({
				metrics: await fontMetricsResolver.getMetrics(family.name, collected),
				fallbackMetrics: systemFallbacksProvider.getMetricsForLocalFont(font),
				font,
				name,
				properties: unifontFontFaceDataToProperties(collected.data),
			});
		}
	}
	return { css, fallbacks };
}
export { optimizeFallbacks };

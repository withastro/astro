import type * as unifont from 'unifont';
import type { FontMetricsResolver, SystemFallbacksProvider } from '../definitions.js';
import type { FontFileData, ResolvedFontFamily } from '../types.js';
import { isGenericFontFamily, unifontFontFaceDataToProperties } from '../utils.js';

export interface CollectedFontForMetrics extends FontFileData {
	data: Partial<unifont.FontFaceData>;
}

export async function optimizeFallbacks({
	family,
	fallbacks: _fallbacks,
	collectedFonts,
	enabled,
	systemFallbacksProvider,
	fontMetricsResolver,
}: {
	family: Pick<ResolvedFontFamily, 'name' | 'nameWithHash'>;
	fallbacks: Array<string>;
	collectedFonts: Array<CollectedFontForMetrics>;
	enabled: boolean;
	systemFallbacksProvider: SystemFallbacksProvider;
	fontMetricsResolver: FontMetricsResolver;
}): Promise<null | {
	css: string;
	fallbacks: Array<string>;
}> {
	// We avoid mutating the original array
	let fallbacks = [..._fallbacks];

	if (fallbacks.length === 0 || !enabled || collectedFonts.length === 0) {
		return null;
	}

	// The last element of the fallbacks is usually a generic family name (eg. serif)
	const lastFallback = fallbacks[fallbacks.length - 1];
	// If it's not a generic family name, we can't infer local fonts to be used as fallbacks
	if (!isGenericFontFamily(lastFallback)) {
		return null;
	}

	// If it's a generic family name, we get the associated local fonts (eg. Arial)
	const localFonts = systemFallbacksProvider.getLocalFonts(lastFallback);
	// Some generic families do not have associated local fonts so we abort early
	if (!localFonts || localFonts.length === 0) {
		return null;
	}

	// If the family is already a system font, no need to generate fallbacks
	if (localFonts.includes(family.name)) {
		return null;
	}

	const localFontsMappings = localFonts.map((font) => ({
		font,
		// We must't wrap in quote because that's handled by the CSS renderer
		name: `${family.nameWithHash} fallback: ${font}`,
	}));

	// We prepend the fallbacks with the local fonts and we dedupe in case a local font is already provided
	fallbacks = [...localFontsMappings.map((m) => m.name), ...fallbacks];
	let css = '';

	for (const { font, name } of localFontsMappings) {
		for (const collected of collectedFonts) {
			// We generate a fallback for each font collected, which is per weight and style
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

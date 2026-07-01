import type * as unifont from 'unifont';
import type { FontMetricsResolver, SystemFallbacksProvider } from '../definitions.js';
import type { FallbackVariant, FontFileData, ResolvedFontFamily } from '../types.js';
import { isGenericFontFamily, unifontFontFaceDataToProperties } from '../utils.js';

export interface CollectedFontForMetrics extends FontFileData {
	data: Partial<unifont.FontFaceData>;
}

function deriveFallbackVariant(data: Partial<unifont.FontFaceData>): FallbackVariant {
	const weight = data.weight;
	if (typeof weight === 'number' && weight >= 700) {
		return 'bold';
	}
	if (typeof weight === 'string') {
		if (weight === 'bold') return 'bold';
		// Variable weights (e.g. "100 900") are treated as normal.
		if (weight.includes(' ')) return 'normal';
		const n = Number.parseInt(weight, 10);
		if (!Number.isNaN(n) && n >= 700) return 'bold';
	}
	return 'normal';
}

export async function optimizeFallbacks({
	family,
	fallbacks: _fallbacks,
	collectedFonts,
	systemFallbacksProvider,
	fontMetricsResolver,
}: {
	family: Pick<ResolvedFontFamily, 'name' | 'uniqueName'>;
	fallbacks: Array<string>;
	collectedFonts: Array<CollectedFontForMetrics>;
	systemFallbacksProvider: SystemFallbacksProvider;
	fontMetricsResolver: FontMetricsResolver;
}): Promise<null | {
	css: string;
	fallbacks: Array<string>;
}> {
	// We avoid mutating the original array
	let fallbacks = [..._fallbacks];

	if (fallbacks.length === 0 || collectedFonts.length === 0) {
		return null;
	}

	// The last element of the fallbacks is usually a generic family name (eg. serif)
	const lastFallback = fallbacks[fallbacks.length - 1];
	// If it's not a generic family name, we can't infer local fonts to be used as fallbacks
	if (!isGenericFontFamily(lastFallback)) {
		return null;
	}

	// For each collected font, the local fallback list may differ based on its variant
	// (e.g. italic-style fonts may map to a different local font than bold ones).
	const collectedWithLocalFonts = collectedFonts.map((collected) => ({
		collected,
		localFonts:
			systemFallbacksProvider.getLocalFonts(lastFallback, deriveFallbackVariant(collected.data)) ??
			[],
	}));

	// Union of all local fonts seen across variants, preserving first-seen order.
	const uniqueLocalFonts: Array<string> = [];
	for (const { localFonts } of collectedWithLocalFonts) {
		for (const font of localFonts) {
			if (!uniqueLocalFonts.includes(font)) {
				uniqueLocalFonts.push(font);
			}
		}
	}

	// Some generic families do not have associated local fonts so we abort early
	if (uniqueLocalFonts.length === 0) {
		return null;
	}

	// If the family is already a system font, no need to generate fallbacks
	if (uniqueLocalFonts.includes(family.name)) {
		return null;
	}

	const nameForFont = (font: string) =>
		// We mustn't wrap in quote because that's handled by the CSS renderer
		`${family.uniqueName} fallback: ${font}`;

	// We prepend the fallbacks with the local fonts
	fallbacks = [...uniqueLocalFonts.map(nameForFont), ...fallbacks];
	let css = '';

	for (const { collected, localFonts } of collectedWithLocalFonts) {
		const properties = unifontFontFaceDataToProperties(collected.data);
		const metrics = await fontMetricsResolver.getMetrics(family.name, collected);
		for (const font of localFonts) {
			css += fontMetricsResolver.generateFontFace({
				metrics,
				fallbackMetrics: systemFallbacksProvider.getMetricsForLocalFont(font),
				font,
				name: nameForFont(font),
				properties,
			});
		}
	}

	return { css, fallbacks };
}

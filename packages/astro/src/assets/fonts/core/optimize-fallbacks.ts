import type * as unifont from 'unifont';
import type { FontMetricsResolver, SystemFallbacksProvider } from '../definitions.js';
import type { FallbackVariant, FontFileData, ResolvedFontFamily } from '../types.js';
import { isGenericFontFamily, unifontFontFaceDataToProperties } from '../utils.js';

export interface CollectedFontForMetrics extends FontFileData {
	data: Partial<unifont.FontFaceData>;
}

/**
 * Returns the local fallback variant matching a font face, or `null` for italic and oblique faces,
 * which get no fallback face: without one, the browser synthesizes the slant from the upright face.
 */
function deriveFallbackVariant(data: Partial<unifont.FontFaceData>): FallbackVariant | null {
	if (data.style && data.style !== 'normal') {
		return null;
	}
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

// Chromium and Firefox synthesize bold only from faces whose weight does not exceed 500.
const MAX_SYNTHESIZABLE_WEIGHT = 500;

/**
 * Caps a numeric weight or weight range at `MAX_SYNTHESIZABLE_WEIGHT`. Returns other weights
 * (e.g. `"normal"`) unchanged.
 */
function capWeight(weight: unifont.FontFaceData['weight']): unifont.FontFaceData['weight'] {
	const values = (
		Array.isArray(weight) ? weight : typeof weight === 'string' ? weight.split(' ') : [weight]
	).map(Number);
	if (values.some(Number.isNaN)) {
		return weight;
	}
	const capped = values.map((value) => Math.min(value, MAX_SYNTHESIZABLE_WEIGHT));
	return capped.length === 2 ? [capped[0], capped[1]] : capped[0];
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

	// Faces of every variant share the family of the normal local font at the same position, so
	// the browser matches them by weight within a single family.
	const normalLocalFonts = systemFallbacksProvider.getLocalFonts(lastFallback, 'normal') ?? [];

	const collectedWithLocalFonts = collectedFonts.map((collected) => {
		const variant = deriveFallbackVariant(collected.data);
		const localFonts = variant
			? (systemFallbacksProvider.getLocalFonts(lastFallback, variant) ?? [])
			: [];
		return {
			collected,
			variant,
			localFonts: localFonts.flatMap((font, index) =>
				// A bold face backed by a regular local font would render regular, because the browser
				// does not synthesize bold for a face that declares a bold weight.
				variant !== 'normal' && normalLocalFonts.includes(font)
					? []
					: [{ font, familyFont: normalLocalFonts[index] ?? font }],
			),
		};
	});

	// Union of all local fonts and fallback families seen across variants, preserving first-seen order.
	const uniqueLocalFonts: Array<string> = [];
	const uniqueFamilyFonts: Array<string> = [];
	for (const { localFonts } of collectedWithLocalFonts) {
		for (const { font, familyFont } of localFonts) {
			if (!uniqueLocalFonts.includes(font)) {
				uniqueLocalFonts.push(font);
			}
			if (!uniqueFamilyFonts.includes(familyFont)) {
				uniqueFamilyFonts.push(familyFont);
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
	fallbacks = [...uniqueFamilyFonts.map(nameForFont), ...fallbacks];
	let css = '';

	for (const { collected, variant, localFonts } of collectedWithLocalFonts) {
		if (localFonts.length === 0) {
			continue;
		}
		// Normal faces are backed by regular local fonts. Declaring a bold-capable weight on them
		// (e.g. 600 or "100 900") would make bold text match a regular font instead of synthesizing bold.
		const properties = unifontFontFaceDataToProperties(
			variant === 'normal'
				? { ...collected.data, weight: capWeight(collected.data.weight) }
				: collected.data,
		);
		const metrics = await fontMetricsResolver.getMetrics(family.name, collected);
		for (const { font, familyFont } of localFonts) {
			css += fontMetricsResolver.generateFontFace({
				metrics,
				fallbackMetrics: systemFallbacksProvider.getMetricsForLocalFont(font),
				font,
				name: nameForFont(familyFont),
				properties,
			});
		}
	}

	return { css, fallbacks };
}

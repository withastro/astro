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

function weightDistanceFrom400(weight: Partial<unifont.FontFaceData>['weight']): number {
	if (weight === undefined) return 0;
	const [min, max] = Array.isArray(weight)
		? weight
		: String(weight)
				.split(' ')
				.map((value) => (value === 'bold' ? 700 : value === 'normal' ? 400 : Number(value)));
	const upper = max ?? min;
	if (Number.isNaN(min) || Number.isNaN(upper)) return Number.POSITIVE_INFINITY;
	if (min <= 400 && 400 <= upper) return 0;
	return Math.min(Math.abs(min - 400), Math.abs(upper - 400));
}

/**
 * Returns the collected font that best represents regular Latin text: Latin subset first,
 * then normal style, then the weight closest to 400. Capsize computes `xWidthAvg` from Latin
 * sample characters, so measuring another subset (eg. cyrillic) or an italic skews the metrics.
 * See https://github.com/withastro/astro/issues/18736
 */
function pickFontForMetrics(
	collectedFonts: Array<CollectedFontForMetrics>,
): CollectedFontForMetrics {
	const score = ({ data }: CollectedFontForMetrics): [number, number, number] => [
		data.meta?.subset === undefined || data.meta.subset === 'latin' ? 0 : 1,
		data.style === undefined || data.style === 'normal' ? 0 : 1,
		weightDistanceFrom400(data.weight),
	];
	const isBetter = (a: CollectedFontForMetrics, b: CollectedFontForMetrics) => {
		const [scoreA, scoreB] = [score(a), score(b)];
		const index = scoreA.findIndex((value, i) => value !== scoreB[i]);
		return index !== -1 && scoreA[index] < scoreB[index];
	};
	return collectedFonts.reduce((best, collected) => (isBetter(collected, best) ? collected : best));
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
	const metrics = await fontMetricsResolver.getMetrics(
		family.name,
		pickFontForMetrics(collectedFonts),
	);

	for (const { collected, localFonts } of collectedWithLocalFonts) {
		const properties = unifontFontFaceDataToProperties(collected.data);
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

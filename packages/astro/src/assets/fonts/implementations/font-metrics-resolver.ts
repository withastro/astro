import { type Font, fromBuffer } from '@capsizecss/unpack';
import type { CssRenderer, FontFetcher, FontMetricsResolver } from '../definitions.js';
import type { FontFaceMetrics } from '../types.js';
import { renderFontSrc } from '../utils.js';

// Source: https://github.com/unjs/fontaine/blob/main/src/metrics.ts
function filterRequiredMetrics({
	ascent,
	descent,
	lineGap,
	unitsPerEm,
	xWidthAvg,
}: Pick<Font, 'ascent' | 'descent' | 'lineGap' | 'unitsPerEm' | 'xWidthAvg'>) {
	return {
		ascent,
		descent,
		lineGap,
		unitsPerEm,
		xWidthAvg,
	};
}

// Source: https://github.com/unjs/fontaine/blob/f00f84032c5d5da72c8798eae4cd68d3ddfbf340/src/css.ts#L7
function toPercentage(value: number, fractionDigits = 4) {
	const percentage = value * 100;
	return `${+percentage.toFixed(fractionDigits)}%`;
}

export function createCapsizeFontMetricsResolver({
	fontFetcher,
	cssRenderer,
}: {
	fontFetcher: FontFetcher;
	cssRenderer: CssRenderer;
}): FontMetricsResolver {
	const cache: Record<string, FontFaceMetrics | null> = {};

	return {
		async getMetrics(name, input) {
			cache[name] ??= filterRequiredMetrics(await fromBuffer(await fontFetcher.fetch(input)));
			return cache[name];
		},
		// Source: https://github.com/unjs/fontaine/blob/f00f84032c5d5da72c8798eae4cd68d3ddfbf340/src/css.ts#L170
		generateFontFace({
			metrics,
			fallbackMetrics,
			name: fallbackName,
			font: fallbackFontName,
			properties,
		}) {
			// Calculate size adjust
			const preferredFontXAvgRatio = metrics.xWidthAvg / metrics.unitsPerEm;
			const fallbackFontXAvgRatio = fallbackMetrics.xWidthAvg / fallbackMetrics.unitsPerEm;
			const sizeAdjust = preferredFontXAvgRatio / fallbackFontXAvgRatio;

			const adjustedEmSquare = metrics.unitsPerEm * sizeAdjust;

			// Calculate metric overrides for preferred font
			const ascentOverride = metrics.ascent / adjustedEmSquare;
			const descentOverride = Math.abs(metrics.descent) / adjustedEmSquare;
			const lineGapOverride = metrics.lineGap / adjustedEmSquare;

			return cssRenderer.generateFontFace(fallbackName, {
				...properties,
				src: renderFontSrc([{ name: fallbackFontName }]),
				'size-adjust': toPercentage(sizeAdjust),
				'ascent-override': toPercentage(ascentOverride),
				'descent-override': toPercentage(descentOverride),
				'line-gap-override': toPercentage(lineGapOverride),
			});
		},
	};
}

import { fromBuffer, type Font } from '@capsizecss/unpack';
import type { CssRenderer, FontFetcher, FontMetricsResolver } from '../definitions.js';
import type { FontFaceMetrics } from '../types.js';
import { renderFontSrc } from '../utils.js';

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

// See: https://github.com/seek-oss/capsize/blob/master/packages/core/src/round.ts
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
		async getMetrics(name, { hash, url }) {
			cache[name] ??= filterRequiredMetrics(await fromBuffer(await fontFetcher.fetch(hash, url)));
			return cache[name];
		},
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
				src: renderFontSrc([{ name: fallbackFontName }]),
				'size-adjust': toPercentage(sizeAdjust),
				'ascent-override': toPercentage(ascentOverride),
				'descent-override': toPercentage(descentOverride),
				'line-gap-override': toPercentage(lineGapOverride),
				...properties,
			});
		},
	};
}

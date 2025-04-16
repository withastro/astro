import { type Font, fromBuffer } from '@capsizecss/unpack';
import { renderFontFace, renderFontSrc } from './utils.js';

export type FontFaceMetrics = Pick<
	Font,
	'ascent' | 'descent' | 'lineGap' | 'unitsPerEm' | 'xWidthAvg'
>;

const metricCache: Record<string, FontFaceMetrics | null> = {};

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

export async function readMetrics(family: string, buffer: Buffer) {
	const metrics = await fromBuffer(buffer);

	metricCache[family] = filterRequiredMetrics(metrics);

	return metricCache[family];
}

// See: https://github.com/seek-oss/capsize/blob/master/packages/core/src/round.ts
function toPercentage(value: number, fractionDigits = 4) {
	const percentage = value * 100;
	return `${+percentage.toFixed(fractionDigits)}%`;
}

export function generateFallbackFontFace({
	metrics,
	fallbackMetrics,
	name: fallbackName,
	font: fallbackFontName,
	properties = {},
}: {
	metrics: FontFaceMetrics;
	fallbackMetrics: FontFaceMetrics;
	name: string;
	font: string;
	properties?: Record<string, string | undefined>;
}) {
	// Credits to: https://github.com/seek-oss/capsize/blob/master/packages/core/src/createFontStack.ts

	// Calculate size adjust
	const preferredFontXAvgRatio = metrics.xWidthAvg / metrics.unitsPerEm;
	const fallbackFontXAvgRatio = fallbackMetrics.xWidthAvg / fallbackMetrics.unitsPerEm;
	const sizeAdjust = preferredFontXAvgRatio / fallbackFontXAvgRatio;

	const adjustedEmSquare = metrics.unitsPerEm * sizeAdjust;

	// Calculate metric overrides for preferred font
	const ascentOverride = metrics.ascent / adjustedEmSquare;
	const descentOverride = Math.abs(metrics.descent) / adjustedEmSquare;
	const lineGapOverride = metrics.lineGap / adjustedEmSquare;

	return renderFontFace({
		'font-family': fallbackName,
		src: renderFontSrc([{ name: fallbackFontName }]),
		'size-adjust': toPercentage(sizeAdjust),
		'ascent-override': toPercentage(ascentOverride),
		'descent-override': toPercentage(descentOverride),
		'line-gap-override': toPercentage(lineGapOverride),
		...properties,
	});
}

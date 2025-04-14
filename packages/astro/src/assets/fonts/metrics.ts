// Adapted from https://github.com/unjs/fontaine/
import { fontFamilyToCamelCase } from '@capsizecss/metrics';
import { type Font, fromBuffer } from '@capsizecss/unpack';

const QUOTES_RE = /^["']|["']$/g;

const withoutQuotes = (str: string) => str.trim().replace(QUOTES_RE, '');

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

export async function getMetricsForFamily(family: string) {
	family = withoutQuotes(family);

	if (family in metricCache) return metricCache[family];

	try {
		const name = fontFamilyToCamelCase(family);
		const { entireMetricsCollection } = await import('@capsizecss/metrics/entireMetricsCollection');
		const metrics = entireMetricsCollection[name as keyof typeof entireMetricsCollection];

		if (!('descent' in metrics)) {
			metricCache[family] = null;
			return null;
		}

		const filteredMetrics = filterRequiredMetrics(metrics);
		metricCache[family] = filteredMetrics;
		return filteredMetrics;
	} catch {
		metricCache[family] = null;
		return null;
	}
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

function toCSS(properties: Record<string, any>, indent = 2) {
	return Object.entries(properties)
		.map(([key, value]) => `${' '.repeat(indent)}${key}: ${value};`)
		.join('\n');
}

export function generateFallbackFontFace(
	metrics: FontFaceMetrics,
	fallback: {
		name: string;
		font: string;
		metrics?: FontFaceMetrics;
		[key: string]: any;
	},
) {
	const {
		name: fallbackName,
		font: fallbackFontName,
		metrics: fallbackMetrics,
		...properties
	} = fallback;

	// Credits to: https://github.com/seek-oss/capsize/blob/master/packages/core/src/createFontStack.ts

	// Calculate size adjust
	const preferredFontXAvgRatio = metrics.xWidthAvg / metrics.unitsPerEm;
	const fallbackFontXAvgRatio = fallbackMetrics
		? fallbackMetrics.xWidthAvg / fallbackMetrics.unitsPerEm
		: 1;

	const sizeAdjust =
		fallbackMetrics && preferredFontXAvgRatio && fallbackFontXAvgRatio
			? preferredFontXAvgRatio / fallbackFontXAvgRatio
			: 1;

	const adjustedEmSquare = metrics.unitsPerEm * sizeAdjust;

	// Calculate metric overrides for preferred font
	const ascentOverride = metrics.ascent / adjustedEmSquare;
	const descentOverride = Math.abs(metrics.descent) / adjustedEmSquare;
	const lineGapOverride = metrics.lineGap / adjustedEmSquare;

	const declaration = {
		'font-family': JSON.stringify(fallbackName),
		src: `local(${JSON.stringify(fallbackFontName)})`,
		'size-adjust': toPercentage(sizeAdjust),
		'ascent-override': toPercentage(ascentOverride),
		'descent-override': toPercentage(descentOverride),
		'line-gap-override': toPercentage(lineGapOverride),
		...properties,
	};

	return `@font-face {\n${toCSS(declaration)}\n}\n`;
}

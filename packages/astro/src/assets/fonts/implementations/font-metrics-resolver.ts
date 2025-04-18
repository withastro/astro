import { fromBuffer, type Font } from '@capsizecss/unpack';
import type { CssRenderer, FontFetcher, FontMetricsResolver } from '../definitions.js';
import type { FontFaceMetrics } from '../types.js';
import { renderFontSrc, type GetMetricsForFamilyFont } from '../utils.js';

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

export class RealFontMetricsResolver implements FontMetricsResolver {
	private cache: Record<string, FontFaceMetrics | null> = {};

	constructor(
		private fontFetcher: FontFetcher,
		private cssRenderer: CssRenderer,
	) {}

	async getMetrics(name: string, { hash, url }: GetMetricsForFamilyFont): Promise<FontFaceMetrics> {
		this.cache[name] ??= filterRequiredMetrics(
			await fromBuffer(await this.fontFetcher.fetch(hash, url)),
		);
		return this.cache[name];
	}

	generateFontFace({
		metrics,
		fallbackMetrics,
		name: fallbackName,
		font: fallbackFontName,
		properties,
	}: {
		metrics: FontFaceMetrics;
		fallbackMetrics: FontFaceMetrics;
		name: string;
		font: string;
		properties: Record<string, string | undefined>;
	}): string {
		// Calculate size adjust
		const preferredFontXAvgRatio = metrics.xWidthAvg / metrics.unitsPerEm;
		const fallbackFontXAvgRatio = fallbackMetrics.xWidthAvg / fallbackMetrics.unitsPerEm;
		const sizeAdjust = preferredFontXAvgRatio / fallbackFontXAvgRatio;

		const adjustedEmSquare = metrics.unitsPerEm * sizeAdjust;

		// Calculate metric overrides for preferred font
		const ascentOverride = metrics.ascent / adjustedEmSquare;
		const descentOverride = Math.abs(metrics.descent) / adjustedEmSquare;
		const lineGapOverride = metrics.lineGap / adjustedEmSquare;

		return this.cssRenderer.generateFontFace(fallbackName, {
			src: renderFontSrc([{ name: fallbackFontName }]),
			'size-adjust': toPercentage(sizeAdjust),
			'ascent-override': toPercentage(ascentOverride),
			'descent-override': toPercentage(descentOverride),
			'line-gap-override': toPercentage(lineGapOverride),
			...properties,
		});
	}
}

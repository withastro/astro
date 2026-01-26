import { type Font, fromBuffer } from '@capsizecss/unpack';
import type { CollectedFontForMetrics } from '../core/optimize-fallbacks.js';
import type { CssRenderer, FontFetcher, FontMetricsResolver } from '../definitions.js';
import type { CssProperties, FontFaceMetrics } from '../types.js';
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

// Source: https://github.com/seek-oss/capsize/blob/b752693428b45994442433f7e3476ca4e3e3c507/packages/core/src/round.ts
function round(value: number) {
	return parseFloat(value.toFixed(4));
}

// Source: https://github.com/seek-oss/capsize/blob/b752693428b45994442433f7e3476ca4e3e3c507/packages/core/src/createFontStack.ts#L5
function toPercentString(value: number) {
	return `${round(value * 100)}%`;
}

export class CapsizeFontMetricsResolver implements FontMetricsResolver {
	readonly #cache: Record<string, FontFaceMetrics | null> = {};
	readonly #fontFetcher: FontFetcher;
	readonly #cssRenderer: CssRenderer;

	constructor({
		fontFetcher,
		cssRenderer,
	}: {
		fontFetcher: FontFetcher;
		cssRenderer: CssRenderer;
	}) {
		this.#fontFetcher = fontFetcher;
		this.#cssRenderer = cssRenderer;
	}

	async getMetrics(name: string, font: CollectedFontForMetrics): Promise<FontFaceMetrics> {
		return (this.#cache[name] ??= filterRequiredMetrics(
			await fromBuffer(await this.#fontFetcher.fetch(font)),
		));
	}

	// Adapted from Capsize
	// Source: https://github.com/seek-oss/capsize/blob/b752693428b45994442433f7e3476ca4e3e3c507/packages/core/src/createFontStack.ts
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
		properties: CssProperties;
	}): string {
		// Calculate size adjust
		const preferredFontXAvgRatio = metrics.xWidthAvg / metrics.unitsPerEm;
		const fallbackFontXAvgRatio = fallbackMetrics.xWidthAvg / fallbackMetrics.unitsPerEm;

		const sizeAdjust =
			preferredFontXAvgRatio && fallbackFontXAvgRatio
				? preferredFontXAvgRatio / fallbackFontXAvgRatio
				: 1;

		const adjustedEmSquare = metrics.unitsPerEm * sizeAdjust;

		// Calculate metric overrides for preferred font
		const ascentOverride = metrics.ascent / adjustedEmSquare;
		const descentOverride = Math.abs(metrics.descent) / adjustedEmSquare;
		const lineGapOverride = metrics.lineGap / adjustedEmSquare;

		// Calculate metric overrides for fallback font
		const fallbackAscentOverride = fallbackMetrics.ascent / adjustedEmSquare;
		const fallbackDescentOverride = Math.abs(fallbackMetrics.descent) / adjustedEmSquare;
		const fallbackLineGapOverride = fallbackMetrics.lineGap / adjustedEmSquare;

		return this.#cssRenderer.generateFontFace(fallbackName, {
			...properties,
			src: renderFontSrc([{ name: fallbackFontName }]),
			'size-adjust': sizeAdjust && sizeAdjust !== 1 ? toPercentString(sizeAdjust) : undefined,
			'ascent-override':
				ascentOverride && ascentOverride !== fallbackAscentOverride
					? toPercentString(ascentOverride)
					: undefined,
			'descent-override':
				descentOverride && descentOverride !== fallbackDescentOverride
					? toPercentString(descentOverride)
					: undefined,
			'line-gap-override':
				lineGapOverride !== fallbackLineGapOverride ? toPercentString(lineGapOverride) : undefined,
		});
	}
}

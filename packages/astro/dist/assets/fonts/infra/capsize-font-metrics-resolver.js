import { fromBuffer } from '@capsizecss/unpack';
import { renderFontSrc } from '../utils.js';
function filterRequiredMetrics({ ascent, descent, lineGap, unitsPerEm, xWidthAvg }) {
	return {
		ascent,
		descent,
		lineGap,
		unitsPerEm,
		xWidthAvg,
	};
}
function round(value) {
	return Number.parseFloat(value.toFixed(4));
}
function toPercentString(value) {
	return `${round(value * 100)}%`;
}
class CapsizeFontMetricsResolver {
	#cache = {};
	#fontFetcher;
	#cssRenderer;
	constructor({ fontFetcher, cssRenderer }) {
		this.#fontFetcher = fontFetcher;
		this.#cssRenderer = cssRenderer;
	}
	async getMetrics(name, font) {
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
	}) {
		const preferredFontXAvgRatio = metrics.xWidthAvg / metrics.unitsPerEm;
		const fallbackFontXAvgRatio = fallbackMetrics.xWidthAvg / fallbackMetrics.unitsPerEm;
		const sizeAdjust =
			preferredFontXAvgRatio && fallbackFontXAvgRatio
				? preferredFontXAvgRatio / fallbackFontXAvgRatio
				: 1;
		const adjustedEmSquare = metrics.unitsPerEm * sizeAdjust;
		const ascentOverride = metrics.ascent / adjustedEmSquare;
		const descentOverride = Math.abs(metrics.descent) / adjustedEmSquare;
		const lineGapOverride = metrics.lineGap / adjustedEmSquare;
		const fallbackAscentOverride = fallbackMetrics.ascent / adjustedEmSquare;
		const fallbackDescentOverride = Math.abs(fallbackMetrics.descent) / adjustedEmSquare;
		const fallbackLineGapOverride = fallbackMetrics.lineGap / adjustedEmSquare;
		return this.#cssRenderer.generateFontFace(fallbackName, {
			...properties,
			src: renderFontSrc([{ name: fallbackFontName }]),
			'size-adjust': sizeAdjust && sizeAdjust !== 1 ? toPercentString(sizeAdjust) : void 0,
			'ascent-override':
				ascentOverride && ascentOverride !== fallbackAscentOverride
					? toPercentString(ascentOverride)
					: void 0,
			'descent-override':
				descentOverride && descentOverride !== fallbackDescentOverride
					? toPercentString(descentOverride)
					: void 0,
			'line-gap-override':
				lineGapOverride !== fallbackLineGapOverride ? toPercentString(lineGapOverride) : void 0,
		});
	}
}
export { CapsizeFontMetricsResolver };

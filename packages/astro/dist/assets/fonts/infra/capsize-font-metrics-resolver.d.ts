import type { CollectedFontForMetrics } from '../core/optimize-fallbacks.js';
import type { CssRenderer, FontFetcher, FontMetricsResolver } from '../definitions.js';
import type { CssProperties, FontFaceMetrics } from '../types.js';
export declare class CapsizeFontMetricsResolver implements FontMetricsResolver {
	#private;
	constructor({ fontFetcher, cssRenderer }: { fontFetcher: FontFetcher; cssRenderer: CssRenderer });
	getMetrics(name: string, font: CollectedFontForMetrics): Promise<FontFaceMetrics>;
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
	}): string;
}

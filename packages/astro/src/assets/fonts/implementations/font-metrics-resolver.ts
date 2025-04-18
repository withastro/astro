import type { FontFetcher, FontMetricsResolver } from '../definitions.js';
import { generateFallbackFontFace, readMetrics, type FontFaceMetrics } from '../metrics.js';
import type { GetMetricsForFamilyFont } from '../utils.js';

// TODO: better impl
export class RealFontMetricsResolver implements FontMetricsResolver {
	constructor(private fontFetcher: FontFetcher) {}

	async getMetrics(name: string, { hash, url }: GetMetricsForFamilyFont): Promise<FontFaceMetrics> {
		return await readMetrics(name, await this.fontFetcher.fetch(hash, url));
	}

	generateFontFace(input: {
		metrics: FontFaceMetrics;
		fallbackMetrics: FontFaceMetrics;
		name: string;
		font: string;
		properties: Record<string, string | undefined>;
	}): string {
		// TODO: use cssRenderer
		return generateFallbackFontFace(input);
	}
}

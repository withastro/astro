import type { DataCollector } from '../definitions.js';
import type { PreloadData } from '../types.js';
import type { GetMetricsForFamilyFont } from '../utils.js';

export class RealDataCollector implements DataCollector {
	constructor(
		private hashToUrlMap: Map<string, string>,
		private preloadData: PreloadData = [],
		private fallbackFontData: { value: GetMetricsForFamilyFont | null },
		private fallbacks: Array<string>,
	) {}

	collect({
		originalUrl,
		hash,
		preload,
	}: {
		originalUrl: string;
		hash: string;
		preload: PreloadData[number] | null;
	}): void {
		if (!this.hashToUrlMap.has(hash)) {
			this.hashToUrlMap.set(hash, originalUrl);
			if (preload) {
				this.preloadData.push(preload);
			}
		}
		if (this.fallbacks && this.fallbacks.length > 0) {
			// If a family has fallbacks, we store the first url we get that may
			// be used for the fallback generation, if capsize doesn't have this
			// family in its built-in collection
			this.fallbackFontData.value ??= {
				hash,
				url: originalUrl,
			};
		}
	}
}

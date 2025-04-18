import type { DataCollector } from '../definitions.js';
import type { PreloadData } from '../types.js';
import type { GetMetricsForFamilyFont } from '../utils.js';
import type * as unifont from 'unifont';

export class RealDataCollector implements DataCollector {
	constructor(
		private hashToUrlMap: Map<string, string>,
		private preloadData: PreloadData = [],
		private fallbackFontData: Array<GetMetricsForFamilyFont>,
		private fallbacks: Array<string>,
	) {}

	collect({
		originalUrl,
		hash,
		preload,
		data,
	}: {
		originalUrl: string;
		hash: string;
		preload: PreloadData[number] | null;
		data: Partial<unifont.FontFaceData>;
	}): void {
		if (!this.hashToUrlMap.has(hash)) {
			this.hashToUrlMap.set(hash, originalUrl);
			if (preload) {
				this.preloadData.push(preload);
			}
		}
		if (
			this.fallbacks &&
			this.fallbacks.length > 0 &&
			// If the same data has already been sent for this family, we don't want to have duplicate fallbacks
			// Such scenario can occur with unicode ranges
			!this.fallbackFontData.some((f) => JSON.stringify(f.data) === JSON.stringify(data))
		) {
			// If a family has fallbacks, we store the first url we get that may
			// be used for the fallback generation
			this.fallbackFontData.push({
				hash,
				url: originalUrl,
				data,
			});
		}
	}
}

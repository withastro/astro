import type * as unifont from 'unifont';
import type { FontMetricsResolver, SystemFallbacksProvider } from '../definitions.js';
import type { FontFileData, ResolvedFontFamily } from '../types.js';
export interface CollectedFontForMetrics extends FontFileData {
	data: Partial<unifont.FontFaceData>;
}
export declare function optimizeFallbacks({
	family,
	fallbacks: _fallbacks,
	collectedFonts,
	systemFallbacksProvider,
	fontMetricsResolver,
}: {
	family: Pick<ResolvedFontFamily, 'name' | 'uniqueName'>;
	fallbacks: Array<string>;
	collectedFonts: Array<CollectedFontForMetrics>;
	systemFallbacksProvider: SystemFallbacksProvider;
	fontMetricsResolver: FontMetricsResolver;
}): Promise<null | {
	css: string;
	fallbacks: Array<string>;
}>;

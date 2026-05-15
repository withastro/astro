import type { SystemFallbacksProvider } from '../definitions.js';
import type { FontFaceMetrics, GenericFallbackName } from '../types.js';
export declare class RealSystemFallbacksProvider implements SystemFallbacksProvider {
	getLocalFonts(fallback: GenericFallbackName): Array<string> | null;
	getMetricsForLocalFont(family: string): FontFaceMetrics;
}

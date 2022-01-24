import { ResolvedConfig } from '../config';
import { Plugin } from '../plugin';
/**
 * A flag for injected helpers. This flag will be set to `false` if the output
 * target is not native es - so that injected helper logic can be conditionally
 * dropped.
 */
export declare const isModernFlag = "__VITE_IS_MODERN__";
export declare const preloadMethod = "__vitePreload";
export declare const preloadMarker = "__VITE_PRELOAD__";
export declare const preloadBaseMarker = "__VITE_PRELOAD_BASE__";
/**
 * Build only. During serve this is performed as part of ./importAnalysis.
 */
export declare function buildImportAnalysisPlugin(config: ResolvedConfig): Plugin;

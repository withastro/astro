import type { Plugin as VitePlugin } from 'vite';
import type { StaticBuildOptions } from '../types.js';
/**
 * Appends assetQueryParams (e.g., ?dpl=<VERCEL_DEPLOYMENT_ID>) to relative
 * JS import paths inside client chunks. Without this, inter-chunk imports
 * bypass the HTML rendering pipeline and miss skew protection query params.
 *
 * Uses es-module-lexer to reliably parse both static and dynamic imports.
 */
export declare function pluginChunkImports(options: StaticBuildOptions): VitePlugin | undefined;

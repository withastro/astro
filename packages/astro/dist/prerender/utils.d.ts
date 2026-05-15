import type { AstroSettings } from '../types/astro.js';
import type { AstroConfig } from '../types/public/config.js';
export declare function getPrerenderDefault(config: AstroConfig): boolean;
/**
 * Returns the correct output directory of the SSR build based on the configuration
 */
export declare function getServerOutputDirectory(settings: AstroSettings): URL;
/**
 * Returns the output directory used by the prerender environment.
 */
export declare function getPrerenderOutputDirectory(settings: AstroSettings): URL;
/**
 * Returns the correct output directory of the client build based on the configuration
 */
export declare function getClientOutputDirectory(settings: AstroSettings): URL;

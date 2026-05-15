import type { Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from '../internal.js';
/**
 * Inline scripts from Astro files directly into the HTML.
 */
export declare function pluginScripts(internals: BuildInternals): VitePlugin;

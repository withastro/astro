import type { Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';
/***** ASTRO PLUGIN *****/
export declare function pluginCSS(
	options: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin[];

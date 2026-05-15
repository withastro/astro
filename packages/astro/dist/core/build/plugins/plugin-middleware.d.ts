import type { Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';
export declare function pluginMiddleware(
	opts: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin;

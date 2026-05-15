import { type Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import type { BuildInternals } from '../build/internal.js';
import type { StaticBuildOptions } from '../build/types.js';
export declare const MIDDLEWARE_MODULE_ID = 'virtual:astro:middleware';
export declare function vitePluginMiddleware({ settings }: { settings: AstroSettings }): VitePlugin;
export declare function vitePluginMiddlewareBuild(
	opts: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin;

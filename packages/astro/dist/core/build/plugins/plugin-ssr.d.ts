import type { Plugin as VitePlugin } from 'vite';
import type { AstroAdapter } from '../../../types/public/index.js';
import type { BuildInternals } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';
type LegacyAdapter = Extract<
	AstroAdapter,
	{
		entrypointResolution?: 'explicit';
	}
>;
export declare function isLegacyAdapter(adapter: AstroAdapter): adapter is LegacyAdapter;
export declare const LEGACY_SSR_ENTRY_VIRTUAL_MODULE = 'virtual:astro:legacy-ssr-entry';
export declare const RESOLVED_LEGACY_SSR_ENTRY_VIRTUAL_MODULE: string;
export declare function pluginSSR(
	options: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin[];
export {};

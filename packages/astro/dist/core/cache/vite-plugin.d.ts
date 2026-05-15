import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
export declare const VIRTUAL_CACHE_PROVIDER_ID = 'virtual:astro:cache-provider';
export declare function vitePluginCacheProvider({
	settings,
}: {
	settings: AstroSettings;
}): VitePlugin | undefined;

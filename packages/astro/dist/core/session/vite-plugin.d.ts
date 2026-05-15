import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
export declare const VIRTUAL_SESSION_DRIVER_ID = 'virtual:astro:session-driver';
export declare function vitePluginSessionDriver({
	settings,
}: {
	settings: AstroSettings;
}): VitePlugin;

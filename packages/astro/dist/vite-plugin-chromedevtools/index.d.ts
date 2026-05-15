import type { Plugin } from 'vite';
import type { AstroSettings } from '../types/astro.js';
interface Payload {
	settings: AstroSettings;
}
export declare function vitePluginChromedevtools({ settings }: Payload): Plugin;
export {};

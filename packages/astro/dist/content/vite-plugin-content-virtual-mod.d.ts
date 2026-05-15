import nodeFs from 'node:fs';
import { type Plugin } from 'vite';
import type { AstroSettings } from '../types/astro.js';
interface AstroContentVirtualModPluginParams {
	settings: AstroSettings;
	fs: typeof nodeFs;
}
export declare function astroContentVirtualModPlugin({
	settings,
	fs,
}: AstroContentVirtualModPluginParams): Plugin;
export {};

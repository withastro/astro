import type { Plugin } from 'vite';
import type { AstroLogger } from '../../core/logger/core.js';
import type { AstroSettings } from '../../types/astro.js';
interface Options {
	settings: AstroSettings;
	sync: boolean;
	logger: AstroLogger;
}
export declare function fontsPlugin({ settings, sync, logger }: Options): Plugin;
export {};

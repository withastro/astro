import type fsMod from 'node:fs';
import type { Plugin } from 'vite';
import type { AstroLogger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
export declare function astroContentImportPlugin({
	fs,
	settings,
	logger,
}: {
	fs: typeof fsMod;
	settings: AstroSettings;
	logger: AstroLogger;
}): Plugin[];

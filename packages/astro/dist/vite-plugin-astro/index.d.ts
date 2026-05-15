import type * as vite from 'vite';
import type { AstroLogger } from '../core/logger/core.js';
import type { AstroSettings } from '../types/astro.js';
import type { PluginMetadata as AstroPluginMetadata } from './types.js';
export { getAstroMetadata } from './metadata.js';
export type { AstroPluginMetadata };
interface AstroPluginOptions {
	settings: AstroSettings;
	logger: AstroLogger;
}
/** Transform .astro files for Vite */
export default function astro({ settings, logger }: AstroPluginOptions): vite.Plugin[];

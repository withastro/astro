import type { ModuleInfo } from '../core/module-loader/index.js';
import type { PluginMetadata } from './types.js';
export declare function getAstroMetadata(modInfo: ModuleInfo): PluginMetadata['astro'] | undefined;
export declare function createDefaultAstroMetadata(): PluginMetadata['astro'];

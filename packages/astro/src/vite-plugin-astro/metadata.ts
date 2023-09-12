import type { ModuleInfo } from '../core/module-loader/index.js';
import type { PluginMetadata } from './types.js';

export function getAstroMetadata(modInfo: ModuleInfo): PluginMetadata['astro'] | undefined {
	if (modInfo.meta?.astro) {
		return modInfo.meta.astro as PluginMetadata['astro'];
	}
	return undefined;
}

import type { ModuleInfo } from '../core/module-loader';
import type { PluginMetadata } from './types';

export function getAstroMetadata(modInfo: ModuleInfo): PluginMetadata['astro'] | undefined {
	if (modInfo.meta?.astro) {
		return modInfo.meta.astro as PluginMetadata['astro'];
	}
	return undefined;
}

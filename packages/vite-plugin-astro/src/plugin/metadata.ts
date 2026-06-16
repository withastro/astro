import type { ModuleInfo } from '../types.js';
import type { AstroPluginMetadata } from './types.js';

export function getAstroMetadata(modInfo: ModuleInfo): AstroPluginMetadata['astro'] | undefined {
	if (modInfo.meta?.astro) {
		return modInfo.meta.astro as AstroPluginMetadata['astro'];
	}
	return undefined;
}

export function createDefaultAstroMetadata(): AstroPluginMetadata['astro'] {
	return {
		hydratedComponents: [],
		clientOnlyComponents: [],
		serverComponents: [],
		scripts: [],
		propagation: 'none',
		containsHead: false,
		pageOptions: {},
	};
}

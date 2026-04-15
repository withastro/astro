import { getOutDirWithinCwd } from '../core/build/common.js';
import type { AstroSettings } from '../types/astro.js';
import type { AstroConfig } from '../types/public/config.js';

export function getPrerenderDefault(config: AstroConfig) {
	return config.output !== 'server';
}

/**
 * Returns the correct output directory of the SSR build based on the configuration
 */
export function getServerOutputDirectory(settings: AstroSettings): URL {
	return settings.buildOutput === 'server'
		? settings.config.build.server
		: getOutDirWithinCwd(settings.config.outDir);
}

/**
 * Returns the output directory used by the prerender environment.
 */
export function getPrerenderOutputDirectory(settings: AstroSettings): URL {
	return new URL('./.prerender/', getServerOutputDirectory(settings));
}

/**
 * Returns the correct output directory of the client build based on the configuration
 */
export function getClientOutputDirectory(settings: AstroSettings): URL {
	const preserveStructure = settings.adapter?.adapterFeatures?.preserveBuildClientDir;

	if (settings.buildOutput === 'server' || preserveStructure) {
		return settings.config.build.client;
	}
	return settings.config.outDir;
}

import type { AstroConfig } from '../@types/astro.js';
import { getOutDirWithinCwd } from '../core/build/common.js';

export function isServerLikeOutput(config: AstroConfig) {
	return config.output === 'server' || config.output === 'hybrid';
}

export function getPrerenderDefault(config: AstroConfig) {
	return config.output === 'hybrid';
}

/**
 * Returns the correct output directory of hte SSR build based on the configuration
 */
export function getOutputDirectory(config: AstroConfig): URL {
	const ssr = isServerLikeOutput(config);
	if (ssr) {
		return config.build.server;
	} else {
		return getOutDirWithinCwd(config.outDir);
	}
}

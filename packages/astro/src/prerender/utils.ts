import type { AstroConfig } from '../@types/astro.js';
import { getOutDirWithinCwd } from '../core/build/common.js';
import { isServerLikeOutput } from '../core/util.js';

export function getPrerenderDefault(config: AstroConfig) {
	return config.output !== 'server';
}

/**
 * Returns the correct output directory of the SSR build based on the configuration
 */
export function getOutputDirectory(config: AstroConfig): URL {
	const ssr = isServerLikeOutput(config);
	if (ssr) {
		return config.build.server;
	} else {
		return getOutDirWithinCwd(config.outDir);
	}
}

import type { Rollup } from 'vite';
import type { AstroConfig } from '../../types/public/config.js';
import type { ViteBuildReturn } from './types.js';
export declare function getTimeStat(timeStart: number, timeEnd: number): string;
/**
 * Given the Astro configuration, it tells if a slash should be appended or not
 */
export declare function shouldAppendForwardSlash(
	trailingSlash: AstroConfig['trailingSlash'],
	buildFormat: AstroConfig['build']['format'],
): boolean;
/**
 * Replaces characters in a chunk name that are not safe for filesystem paths or URLs.
 * Characters like `!` and `~` can leak from Vite module IDs into Rollup chunk names
 * and break deploys on platforms like Netlify.
 */
export declare function cleanChunkName(name: string): string;
export declare function viteBuildReturnToRollupOutputs(
	viteBuildReturn: ViteBuildReturn,
): Rollup.RollupOutput[];

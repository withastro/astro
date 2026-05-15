import type { AstroConfig } from 'astro';
import type { Options } from './types.js';
export declare function createConfigPlugin(
	config: Options,
): NonNullable<AstroConfig['vite']['plugins']>[number];

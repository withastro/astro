import type { AstroConfig } from 'astro';
import type { Arguments } from 'yargs-parser';
import type { DBConfigInput } from '../../../types.js';
export declare function cmd({
	flags,
	astroConfig,
}: {
	dbConfig: DBConfigInput;
	astroConfig: AstroConfig;
	flags: Arguments;
}): Promise<void>;

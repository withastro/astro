import type { AstroConfig } from 'astro';
import type { Arguments } from 'yargs-parser';
import type { DBConfig } from '../../../types.js';
export declare function cmd({
	dbConfig,
	flags,
}: {
	astroConfig: AstroConfig;
	dbConfig: DBConfig;
	flags: Arguments;
}): Promise<void>;

import type { AstroConfig } from 'astro';
import type { Arguments } from 'yargs-parser';
export declare function cli({
	flags,
	config: astroConfig,
}: {
	flags: Arguments;
	config: AstroConfig;
}): Promise<void>;

import type yargs from 'yargs-parser';
import { printHelp } from '../../core/messages.js';
import { sync as _sync } from '../../core/sync/index.js';
import { flagsToAstroInlineConfig } from '../flags.js';

interface SyncOptions {
	flags: yargs.Arguments;
}

export async function sync({ flags }: SyncOptions) {
	if (flags?.help || flags?.h) {
		printHelp({
			commandName: 'astro sync',
			usage: '[...flags]',
			tables: {
				Flags: [['--help (-h)', 'See all available flags.']],
			},
			description: `Generates TypeScript types for all Astro modules.`,
		});
		return 0;
	}

	const inlineConfig = flagsToAstroInlineConfig(flags);

	const exitCode = await _sync(inlineConfig);
	return exitCode;
}

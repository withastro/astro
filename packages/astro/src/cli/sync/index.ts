import type yargs from 'yargs-parser';
import { printHelp } from '../../core/messages.js';
import _sync from '../../core/sync/index.js';
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
				Flags: [
					['--force', 'Clear the content layer cache, forcing a full rebuild.'],
					['--help (-h)', 'See all available flags.'],
				],
			},
			description: `Generates TypeScript types for all Astro modules.`,
		});
		return 0;
	}

	try {
		await _sync(flagsToAstroInlineConfig(flags), { telemetry: true });
		return 0;
	} catch (_) {
		return 1;
	}
}

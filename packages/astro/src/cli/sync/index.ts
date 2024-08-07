import { printHelp } from '../../core/messages.js';
import _sync from '../../core/sync/index.js';
import { flagsToAstroInlineConfig, type Flags } from '../flags.js';

interface SyncOptions {
	flags: Flags;
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

	try {
		await _sync({ inlineConfig: flagsToAstroInlineConfig(flags), telemetry: true });
		return 0;
	} catch (_) {
		return 1;
	}
}

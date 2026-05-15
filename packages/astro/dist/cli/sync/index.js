import { printHelp } from '../../core/messages/runtime.js';
import _sync from '../../core/sync/index.js';
import { flagsToAstroInlineConfig } from '../flags.js';
async function sync({ flags }) {
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
	await _sync(flagsToAstroInlineConfig(flags), { telemetry: true });
}
export { sync };

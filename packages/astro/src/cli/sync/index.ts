import type yargs from 'yargs-parser';
import { printHelp } from '../../core/messages.js';
import _sync from '../../core/sync/index.js';
import { flagsToAstroInlineConfig } from '../flags.js';
import { resolveConfig } from '../../core/config/config.js';
import { createNodeLogger } from '../../core/config/logging.js';
import { telemetry } from '../../events/index.js';
import { eventCliSession } from '../../events/session.js';
import { createSettings } from '../../core/config/settings.js';

type ProcessExit = 0 | 1;

interface SyncOptions {
	flags: yargs.Arguments;
}

export async function sync({ flags }: SyncOptions): Promise<ProcessExit> {
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
	const logger = createNodeLogger(inlineConfig);
	const { userConfig, astroConfig } = await resolveConfig(inlineConfig ?? {}, 'sync');
	telemetry.record(eventCliSession('sync', userConfig));
	const settings = await createSettings(astroConfig, inlineConfig.root);

	try {
		await _sync({ logger, settings });
		return 0;
	} catch (_) {
		return 1;
	}
}

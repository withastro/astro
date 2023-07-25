import { cyan } from 'kleur/colors';
import type yargs from 'yargs-parser';
import { resolveRoot } from '../../core/config/index.js';
import devServer from '../../core/dev/index.js';
import { info, type LogOptions } from '../../core/logger/core.js';
import { printHelp } from '../../core/messages.js';
import { flagsToAstroInlineConfig, handleConfigError } from '../load-settings.js';

interface DevOptions {
	flags: yargs.Arguments;
	logging: LogOptions;
}

export async function dev({ flags, logging }: DevOptions) {
	if (flags.help || flags.h) {
		printHelp({
			commandName: 'astro dev',
			usage: '[...flags]',
			tables: {
				Flags: [
					['--port', `Specify which port to run on. Defaults to 3000.`],
					['--host', `Listen on all addresses, including LAN and public addresses.`],
					['--host <custom-address>', `Expose on a network IP address at <custom-address>`],
					['--open', 'Automatically open the app in the browser on server start'],
					['--help (-h)', 'See all available flags.'],
				],
			},
			description: `Check ${cyan(
				'https://docs.astro.build/en/reference/cli-reference/#astro-dev'
			)} for more information.`,
		});
		return;
	}

	const inlineConfig = flagsToAstroInlineConfig(flags);

	return await devServer(inlineConfig, {
		logging,
		handleConfigError(e) {
			const root = resolveRoot(flags.root);
			handleConfigError(e, { cmd: 'dev', cwd: root, flags, logging });
			info(logging, 'astro', 'Continuing with previous valid configuration\n');
		},
	});
}

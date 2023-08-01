import { cyan } from 'kleur/colors';
import type yargs from 'yargs-parser';
import devServer from '../../core/dev/index.js';
import { printHelp } from '../../core/messages.js';
import { flagsToAstroInlineConfig } from '../flags.js';

interface DevOptions {
	flags: yargs.Arguments;
}

export async function dev({ flags }: DevOptions) {
	if (flags.help || flags.h) {
		printHelp({
			commandName: 'astro dev',
			usage: '[...flags]',
			tables: {
				Flags: [
					['--port', `Specify which port to run on. Defaults to 4321.`],
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

	return await devServer(inlineConfig);
}

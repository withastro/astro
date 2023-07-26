import type yargs from 'yargs-parser';
import _build from '../../core/build/index.js';
import type { LogOptions } from '../../core/logger/core.js';
import { printHelp } from '../../core/messages.js';
import { flagsToAstroInlineConfig } from '../load-settings.js';

interface BuildOptions {
	flags: yargs.Arguments;
	logging: LogOptions;
}

export async function build({ flags, logging }: BuildOptions) {
	if (flags?.help || flags?.h) {
		printHelp({
			commandName: 'astro build',
			usage: '[...flags]',
			tables: {
				Flags: [
					['--drafts', `Include Markdown draft pages in the build.`],
					['--help (-h)', 'See all available flags.'],
				],
			},
			description: `Builds your site for deployment.`,
		});
		return;
	}

	const inlineConfig = flagsToAstroInlineConfig(flags);

	await _build(inlineConfig, {
		logging,
		teardownCompiler: true,
	});
}

import type yargs from 'yargs-parser';
import _build from '../../core/build/index.js';
import { printHelp } from '../../core/messages.js';
import { flagsToAstroInlineConfig } from '../flags.js';

interface BuildOptions {
	flags: yargs.Arguments;
}

export async function build({ flags }: BuildOptions) {
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
		teardownCompiler: true,
	});
}

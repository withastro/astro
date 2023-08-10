import { cyan } from 'kleur/colors';
import type yargs from 'yargs-parser';
import { printHelp } from '../../core/messages.js';
import previewServer from '../../core/preview/index.js';
import { flagsToAstroInlineConfig } from '../flags.js';

interface PreviewOptions {
	flags: yargs.Arguments;
}

export async function preview({ flags }: PreviewOptions) {
	if (flags?.help || flags?.h) {
		printHelp({
			commandName: 'astro preview',
			usage: '[...flags]',
			tables: {
				Flags: [
					['--open', 'Automatically open the app in the browser on server start'],
					['--help (-h)', 'See all available flags.'],
				],
			},
			description: `Starts a local server to serve your static dist/ directory. Check ${cyan(
				'https://docs.astro.build/en/reference/cli-reference/#astro-preview'
			)} for more information.`,
		});
		return;
	}

	const inlineConfig = flagsToAstroInlineConfig(flags);

	return await previewServer(inlineConfig);
}

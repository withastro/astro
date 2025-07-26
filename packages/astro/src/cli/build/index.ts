import _build from '../../core/build/index.js';
import { printHelp } from '../../core/messages.js';
import { type Flags, flagsToAstroInlineConfig } from '../flags.js';

interface BuildOptions {
	flags: Flags;
}

export async function build({ flags }: BuildOptions) {
	if (flags?.help || flags?.h) {
		printHelp({
			commandName: 'astro build',
			usage: '[...flags]',
			tables: {
				Flags: [
					['--outDir <directory>', `Specify the output directory for the build.`],
					['--mode', `Specify the mode of the project. Defaults to "production".`],
					[
						'--devOutput',
						'Output a development-based build similar to code transformed in `astro dev`.',
					],
					[
						'--force',
						'Clear the content layer and content collection cache, forcing a full rebuild.',
					],
					['--help (-h)', 'See all available flags.'],
				],
			},
			description: `Builds your site for deployment.`,
		});
		return;
	}

	//console.log("flags :", flags);

	const inlineConfig = flagsToAstroInlineConfig(flags);

	//console.log("inlineConfig :", inlineConfig);

	await _build(inlineConfig, { devOutput: !!flags.devOutput });
}

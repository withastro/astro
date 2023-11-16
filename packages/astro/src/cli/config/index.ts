import type yargs from 'yargs-parser';

import { cyan } from 'kleur/colors';
import { fileURLToPath } from 'node:url';

import { printHelp } from '../../core/messages.js';
import { flagsToAstroInlineConfig } from '../flags.js';
import { resolveConfig } from '../../core/config/config.js';
import { createSettings } from '../../core/config/settings.js';
import { isValidKey, coerce } from '../../preferences/index.js';

interface PreferencesOptions {
	flags: yargs.Arguments;
}

export async function config(key: string, value: string | undefined, { flags }: PreferencesOptions): Promise<number> {
	if (flags?.help || flags?.h) {
		printHelp({
			commandName: 'astro config',
			usage: '[key] [:value]',
			tables: {
				Flags: [
					['--global', 'Set configuration globally.'],
					['--help (-h)', 'See all available flags.'],
				],
			},
			description: `Starts a local server to serve your static dist/ directory. Check ${cyan(
				'https://docs.astro.build/en/reference/cli-reference/#astro-preview'
			)} for more information.`,
		});
		return 0;
	}

	const inlineConfig = flagsToAstroInlineConfig(flags);
	const { astroConfig } = await resolveConfig(inlineConfig ?? {}, 'dev');
	const settings = await createSettings(astroConfig, fileURLToPath(astroConfig.root));
	const location = flags.global ? 'global' : undefined;
	if (!isValidKey(key)) {
		throw new Error(`Unsupported config key "${key}"!`);
	}

	if (value === undefined) {
		// eslint-disable-next-line no-console
		console.log(settings.preferences.get(key, { location }));
	} else {
		settings.preferences.set(key, coerce(key, value) as any, { location });
	}

	return 0;
}

import type { Arguments } from 'yargs-parser';
import { createLoggerFromFlags, flagsToAstroInlineConfig } from '../flags.js';
import { getPackage } from '../install-package.js';
import { resolveConfig } from '../../core/config/config.js';


export async function db({ flags }: { flags: Arguments }) {
	const logger = createLoggerFromFlags(flags);
	const getPackageOpts = { skipAsk: flags.yes || flags.y, cwd: flags.root };
	const dbPackage = await getPackage<{ cli: any; }>(
		'@astrojs/db',
		logger,
		getPackageOpts,
		[]
	);

	if (!dbPackage) {
		logger.error(
			'check',
			'The `@astrojs/db` package is required for this command to work. Please manually install it in your project and try again.'
		);
		return;
	}

	const { cli } = dbPackage;
	const inlineConfig = flagsToAstroInlineConfig(flags);
	const { astroConfig } = await resolveConfig(inlineConfig, 'build');

	await cli({flags, config: astroConfig});
}

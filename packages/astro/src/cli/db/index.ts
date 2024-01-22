import type { Arguments } from 'yargs-parser';
import { createLoggerFromFlags } from '../flags.js';
import { getPackage } from '../install-package.js';

export async function db({ flags }: { flags: Arguments }) {
	const logger = createLoggerFromFlags(flags);
	const getPackageOpts = { skipAsk: flags.yes || flags.y, cwd: flags.root };
	const dbPackage = await getPackage<any>(
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

	const [command, ...args] = flags._.slice(3).map(v => v.toString());
	await cli(command, args);
}

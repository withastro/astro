import { resolveConfig } from '../../core/config/config.js';
import { createLoggerFromFlags, flagsToAstroInlineConfig } from '../flags.js';
import { getPackage } from '../install-package.js';
async function db({ flags }) {
	const logger = createLoggerFromFlags(flags);
	const getPackageOpts = {
		skipAsk: !!flags.yes || !!flags.y,
		cwd: flags.root,
	};
	const dbPackage = await getPackage('@astrojs/db', logger, getPackageOpts, []);
	if (!dbPackage) {
		logger.error(
			'check',
			'The `@astrojs/db` package is required for this command to work. Please manually install it in your project and try again.',
		);
		return;
	}
	const { cli } = dbPackage;
	const inlineConfig = flagsToAstroInlineConfig(flags);
	const { astroConfig } = await resolveConfig(inlineConfig, 'build');
	await cli({ flags, config: astroConfig });
}
export { db };

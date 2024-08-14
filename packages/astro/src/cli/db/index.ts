import type { AstroConfig } from '../../@types/astro.js';
import { resolveConfig } from '../../core/config/config.js';
import { apply as applyPolyfill } from '../../core/polyfill.js';
import { type Flags, createLoggerFromFlags, flagsToAstroInlineConfig } from '../flags.js';
import { getPackage } from '../install-package.js';

interface YargsArguments {
	_: Array<string | number>;
	'--'?: Array<string | number>;
	[argName: string]: any;
}

type DBPackage = {
	cli: (args: { flags: YargsArguments; config: AstroConfig }) => unknown;
};

export async function db({ positionals, flags }: { positionals: string[]; flags: Flags }) {
	applyPolyfill();
	const logger = createLoggerFromFlags(flags);
	const getPackageOpts = {
		skipAsk: !!flags.yes || !!flags.y,
		cwd: typeof flags.root == 'string' ? flags.root : undefined,
	};
	const dbPackage = await getPackage<DBPackage>('@astrojs/db', logger, getPackageOpts, []);

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

	const yargsArgs: YargsArguments = {
		_: positionals,
		...flags,
	};

	await cli({ flags: yargsArgs, config: astroConfig });
}

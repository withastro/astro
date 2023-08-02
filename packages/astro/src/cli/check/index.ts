import path from 'node:path';
import type { Arguments } from 'yargs-parser';
import { error, info } from '../../core/logger/core.js';
import { createLoggingFromFlags } from '../flags.js';
import { getPackage } from '../install-package.js';

export async function check(flags: Arguments) {
	const logging = createLoggingFromFlags(flags);
	const getPackageOpts = { skipAsk: flags.yes || flags.y, cwd: flags.root };
	const checkPackage = await getPackage<typeof import('@astrojs/check')>(
		'@astrojs/check',
		logging,
		getPackageOpts,
		['typescript']
	);
	const typescript = await getPackage('typescript', logging, getPackageOpts);

	if (!checkPackage || !typescript) {
		error(
			logging,
			'check',
			'The `@astrojs/check` and `typescript` packages are required for this command to work. Please manually install them into your project and try again.'
		);
		return;
	}

	const { check: checker, parseArgsAsCheckConfig } = checkPackage;

	const config = parseArgsAsCheckConfig(process.argv);

	info(logging, 'check', `Getting diagnostics for Astro files in ${path.resolve(config.root)}...`);
	return await checker(config);
}

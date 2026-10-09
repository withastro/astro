import path from 'node:path';
import { getMajor } from 'verkit';
import { ensureProcessNodeEnv } from '../../core/util.js';
import { createLoggerFromFlags, type Flags, flagsToAstroInlineConfig } from '../flags.js';
import { getPackage, getPackageVersion } from '../install-package.js';

export async function check(flags: Flags): Promise<boolean | void> {
	ensureProcessNodeEnv('production');
	const logger = createLoggerFromFlags(flags);
	const getPackageOpts = {
		skipAsk: !!flags.yes || !!flags.y,
		cwd: flags.root,
	};
	const typescriptVersion = await getPackageVersion('typescript', flags.root);

	if (typescriptVersion && getMajor(typescriptVersion) >= 7) {
		logger.error(
			'check',
			'astro check does not currently support TypeScript 7.0. To continue using astro check, install TypeScript 6 instead.\n\n' +
				'astro check will be deprecated in a future Astro release. Experimental support for type-checking Astro files with TypeScript 7.1+ is available through @astrojs/ts-content-mapper. See its README for setup instructions:\n' +
				'https://github.com/withastro/astro/tree/main/packages/language-tools/ts-content-mapper#usage',
		);
		return true;
	}

	// @ts-ignore For some unknown reason, in CI TS isn't able to get the type here even though it works locally.
	const checkPackage = await getPackage<typeof import('@astrojs/check')>(
		'@astrojs/check',
		logger,
		getPackageOpts,
		['typescript'],
	);
	const typescript = await getPackage('typescript', logger, getPackageOpts);

	if (!checkPackage || !typescript) {
		logger.error(
			'check',
			'The `@astrojs/check` and `typescript` packages are required for this command to work. Please manually install them into your project and try again.',
		);
		return;
	}

	if (!flags.noSync && !flags.help) {
		// Run sync before check to make sure types are generated.
		// NOTE: In the future, `@astrojs/check` can expose a `before lint` hook so that this works during `astro check --watch` too.
		// For now, we run this once as usually `astro check --watch` is ran alongside `astro dev` which also calls `astro sync`.
		const { default: sync } = await import('../../core/sync/index.js');
		await sync(flagsToAstroInlineConfig(flags));
	}

	const { check: checker, parseArgsAsCheckConfig } = checkPackage;

	const config = parseArgsAsCheckConfig(process.argv);

	logger.info('check', `Getting diagnostics for Astro files in ${path.resolve(config.root)}...`);
	return await checker(config);
}

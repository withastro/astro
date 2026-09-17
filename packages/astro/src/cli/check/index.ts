import path from 'node:path';
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
	const typescriptMajor = Number.parseInt(typescriptVersion?.split('.')[0] ?? '', 10);

	if (typescriptMajor >= 7) {
		logger.error(
			'check',
			`astro check is deprecated and does not support TypeScript ${typescriptVersion}. ` +
				'To type-check Astro files, use TypeScript 7.1 or later with `@astrojs/ts-content-mapper`, then run `astro sync && tsc --noEmit --runExternalCode`. ' +
				'See https://github.com/withastro/astro/tree/main/packages/language-tools/ts-content-mapper#usage',
		);
		return true;
	}

	logger.warn(
		'deprecated',
		'`astro check` is deprecated and will be removed in a future major release. Migrate to TypeScript 7.1 or later and `@astrojs/ts-content-mapper`. See https://github.com/withastro/astro/tree/main/packages/language-tools/ts-content-mapper#usage',
	);

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

import path from 'node:path';
import { ensureProcessNodeEnv } from '../../core/util.js';
import { createLoggerFromFlags, type Flags, flagsToAstroInlineConfig } from '../flags.js';
import { getPackage } from '../install-package.js';

export async function check(flags: Flags): Promise<boolean | void> {
	ensureProcessNodeEnv('production');
	const logger = createLoggerFromFlags(flags);
	const getPackageOpts = {
		skipAsk: !!flags.yes || !!flags.y,
		cwd: flags.root,
	};
	// @ts-ignore For some unknown reason, in CI TS isn't able to get the type here even though it works locally.
	const checkPackage = await getPackage<typeof import('@astrojs/check')>(
		'@astrojs/check',
		logger,
		getPackageOpts,
		['typescript'],
	);
	const typescript = await getPackage('typescript', logger, getPackageOpts);

	if (!checkPackage || !typescript) {
		const missing = [
			checkPackage ? undefined : '`@astrojs/check`',
			typescript ? undefined : '`typescript`',
		].filter((name) => name !== undefined);
		logger.error(
			'check',
			`The ${missing.join(' and ')} ${missing.length > 1 ? 'packages are' : 'package is'} required for this command to work. Please manually install ${missing.length > 1 ? 'them' : 'it'} into your project and try again.`,
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

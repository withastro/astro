import { createRequire } from 'node:module';
import { sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import boxen from 'boxen';
import { execa } from 'execa';
import { bold, cyan, dim, magenta } from 'kleur/colors';
import ora from 'ora';
import prompts from 'prompts';
import resolvePackage from 'resolve';
import whichPm from 'which-pm';
import { type Logger } from '../core/logger/core.js';
const require = createRequire(import.meta.url);

type GetPackageOptions = {
	skipAsk?: boolean;
	optional?: boolean;
	cwd?: string;
};

export async function getPackage<T>(
	packageName: string,
	logger: Logger,
	options: GetPackageOptions,
	otherDeps: string[] = []
): Promise<T | undefined> {
	try {
		// Custom resolution logic for @astrojs/db. Since it lives in our monorepo,
		// the generic tryResolve() method doesn't work.
		if (packageName === '@astrojs/db') {
			const packageJsonLoc = require.resolve(packageName + '/package.json', {
				paths: [options.cwd ?? process.cwd()],
			});
			const packageLoc = pathToFileURL(packageJsonLoc.replace(`package.json`, 'dist/index.js'));
			const packageImport = await import(packageLoc.toString());
			return packageImport as T;
		}
		await tryResolve(packageName, options.cwd ?? process.cwd());
		const packageImport = await import(packageName);
		return packageImport as T;
	} catch (e) {
		if (options.optional) return undefined;
		logger.info(
			'SKIP_FORMAT',
			`To continue, Astro requires the following dependency to be installed: ${bold(packageName)}.`
		);
		const result = await installPackage([packageName, ...otherDeps], options, logger);

		if (result) {
			const packageImport = await import(packageName);
			return packageImport;
		} else {
			return undefined;
		}
	}
}

function tryResolve(packageName: string, cwd: string) {
	return new Promise((resolve, reject) => {
		resolvePackage(
			packageName,
			{
				basedir: cwd,
			},
			(err) => {
				if (err) {
					reject(err);
				} else {
					resolve(0);
				}
			}
		);
	});
}

function getInstallCommand(packages: string[], packageManager: string) {
	switch (packageManager) {
		case 'npm':
			return { pm: 'npm', command: 'install', flags: [], dependencies: packages };
		case 'yarn':
			return { pm: 'yarn', command: 'add', flags: [], dependencies: packages };
		case 'pnpm':
			return { pm: 'pnpm', command: 'add', flags: [], dependencies: packages };
		case 'bun':
			return { pm: 'bun', command: 'add', flags: [], dependencies: packages };
		default:
			return null;
	}
}

async function installPackage(
	packageNames: string[],
	options: GetPackageOptions,
	logger: Logger
): Promise<boolean> {
	const cwd = options.cwd ?? process.cwd();
	const packageManager = (await whichPm(cwd)).name ?? 'npm';
	const installCommand = getInstallCommand(packageNames, packageManager);

	if (!installCommand) {
		return false;
	}

	const coloredOutput = `${bold(installCommand.pm)} ${installCommand.command}${[
		'',
		...installCommand.flags,
	].join(' ')} ${cyan(installCommand.dependencies.join(' '))}`;
	const message = `\n${boxen(coloredOutput, {
		margin: 0.5,
		padding: 0.5,
		borderStyle: 'round',
	})}\n`;
	logger.info(
		'SKIP_FORMAT',
		`\n  ${magenta('Astro will run the following command:')}\n  ${dim(
			'If you skip this step, you can always run it yourself later'
		)}\n${message}`
	);

	let response;
	if (options.skipAsk) {
		response = true;
	} else {
		response = (
			await prompts({
				type: 'confirm',
				name: 'askToContinue',
				message: 'Continue?',
				initial: true,
			})
		).askToContinue;
	}

	if (Boolean(response)) {
		const spinner = ora('Installing dependencies...').start();
		try {
			await execa(
				installCommand.pm,
				[installCommand.command, ...installCommand.flags, ...installCommand.dependencies],
				{ cwd: cwd }
			);
			spinner.succeed();

			return true;
		} catch (err) {
			logger.debug('add', 'Error installing dependencies', err);
			spinner.fail();

			return false;
		}
	} else {
		return false;
	}
}

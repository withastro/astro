import boxen from 'boxen';
import { execa } from 'execa';
import { bold, cyan, dim, magenta } from 'kleur/colors';
import { createRequire } from 'node:module';
import ora from 'ora';
import prompts from 'prompts';
import whichPm from 'which-pm';
import { type Logger } from '../core/logger/core.js';

type GetPackageOptions = {
	skipAsk?: boolean;
	cwd?: string;
};

export async function getPackage<T>(
	packageName: string,
	logger: Logger,
	options: GetPackageOptions,
	otherDeps: string[] = []
): Promise<T | undefined> {
	const require = createRequire(options.cwd ?? process.cwd());

	let packageImport;
	try {
		require.resolve(packageName, { paths: [options.cwd ?? process.cwd()] });

		// The `require.resolve` is required as to avoid Node caching the failed `import`
		packageImport = await import(packageName);
	} catch (e) {
		logger.info(
			'',
			`To continue, Astro requires the following dependency to be installed: ${bold(packageName)}.`
		);
		const result = await installPackage([packageName, ...otherDeps], options, logger);

		if (result) {
			packageImport = await import(packageName);
		} else {
			return undefined;
		}
	}

	return packageImport as T;
}

function getInstallCommand(packages: string[], packageManager: string) {
	switch (packageManager) {
		case 'npm':
			return { pm: 'npm', command: 'install', flags: [], dependencies: packages };
		case 'yarn':
			return { pm: 'yarn', command: 'add', flags: [], dependencies: packages };
		case 'pnpm':
			return { pm: 'pnpm', command: 'add', flags: [], dependencies: packages };
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
		null,
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

import { createRequire } from 'node:module';
import boxen from 'boxen';
import ci from 'ci-info';
import { detect, resolveCommand } from 'package-manager-detector';
import colors from 'picocolors';
import prompts from 'prompts';
import yoctoSpinner from 'yocto-spinner';
import type { Logger } from '../core/logger/core.js';
import { exec } from './exec.js';

const require = createRequire(import.meta.url);
const { bold, cyan, dim, magenta } = colors;

type GetPackageOptions = {
	skipAsk?: boolean;
	optional?: boolean;
	cwd?: string;
};

export async function getPackage<T>(
	packageName: string,
	logger: Logger,
	options: GetPackageOptions,
	otherDeps: string[] = [],
): Promise<T | undefined> {
	try {
		// Try to resolve with `createRequire` first to prevent ESM caching of the package
		// if it errors and fails here
		require.resolve(packageName, { paths: [options.cwd ?? process.cwd()] });
		const packageImport = await import(packageName);
		return packageImport as T;
	} catch {
		if (options.optional) return undefined;
		let message = `To continue, Astro requires the following dependency to be installed: ${bold(
			packageName,
		)}.`;

		if (ci.isCI) {
			message += ` Packages cannot be installed automatically in CI environments.`;
		}

		logger.info('SKIP_FORMAT', message);

		if (ci.isCI) {
			return undefined;
		}

		const result = await installPackage([packageName, ...otherDeps], options, logger);

		if (result) {
			const packageImport = await import(packageName);
			return packageImport;
		} else {
			return undefined;
		}
	}
}

async function installPackage(
	packageNames: string[],
	options: GetPackageOptions,
	logger: Logger,
): Promise<boolean> {
	const cwd = options.cwd ?? process.cwd();
	const packageManager = await detect({
		cwd,
		// Include the `install-metadata` strategy to have the package manager that's
		// used for installation take precedence
		strategies: ['install-metadata', 'lockfile', 'packageManager-field'],
	});
	const installCommand = resolveCommand(packageManager?.agent ?? 'npm', 'add', []);
	if (!installCommand) return false;

	if (installCommand.command === 'deno') {
		// Deno requires npm prefix to install packages
		packageNames = packageNames.map((name) => `npm:${name}`);
	}
	const coloredOutput = `${bold(installCommand.command)} ${installCommand.args.join(' ')} ${cyan(packageNames.join(' '))}`;
	const message = `\n${boxen(coloredOutput, {
		margin: 0.5,
		padding: 0.5,
		borderStyle: 'round',
	})}\n`;
	logger.info(
		'SKIP_FORMAT',
		`\n  ${magenta('Astro will run the following command:')}\n  ${dim(
			'If you skip this step, you can always run it yourself later',
		)}\n${message}`,
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
		const spinner = yoctoSpinner({ text: 'Installing dependencies...' }).start();
		try {
			await exec(installCommand.command, [...installCommand.args, ...packageNames], {
				nodeOptions: {
					cwd,
					// reset NODE_ENV to ensure install command run in dev mode
					env: { NODE_ENV: undefined },
				},
			});
			spinner.success();

			return true;
		} catch (err) {
			logger.debug('add', 'Error installing dependencies', err);
			spinner.error();

			return false;
		}
	} else {
		return false;
	}
}

export async function fetchPackageJson(
	scope: string | undefined,
	name: string,
	tag: string,
): Promise<Record<string, any> | Error> {
	const packageName = `${scope ? `${scope}/` : ''}${name}`;
	const registry = await getRegistry();
	const res = await fetch(`${registry}/${packageName}/${tag}`);
	if (res.status >= 200 && res.status < 300) {
		return await res.json();
	} else if (res.status === 404) {
		// 404 means the package doesn't exist, so we don't need an error message here
		return new Error();
	} else {
		return new Error(`Failed to fetch ${registry}/${packageName}/${tag} - GET ${res.status}`);
	}
}

export async function fetchPackageVersions(packageName: string): Promise<string[] | Error> {
	const registry = await getRegistry();
	const res = await fetch(`${registry}/${packageName}`, {
		headers: { accept: 'application/vnd.npm.install-v1+json' },
	});
	if (res.status >= 200 && res.status < 300) {
		return await res.json().then((data) => Object.keys(data.versions));
	} else if (res.status === 404) {
		// 404 means the package doesn't exist, so we don't need an error message here
		return new Error();
	} else {
		return new Error(`Failed to fetch ${registry}/${packageName} - GET ${res.status}`);
	}
}

// Users might lack access to the global npm registry, this function
// checks the user's project type and will return the proper npm registry
//
// A copy of this function also exists in the create-astro package
let _registry: string;
async function getRegistry(): Promise<string> {
	if (_registry) return _registry;
	const fallback = 'https://registry.npmjs.org';
	const packageManager = (await detect())?.name || 'npm';
	try {
		const { stdout } = await exec(packageManager, ['config', 'get', 'registry']);
		_registry = stdout.trim()?.replace(/\/$/, '') || fallback;
		// Detect cases where the shell command returned a non-URL (e.g. a warning)
		if (!new URL(_registry).host) _registry = fallback;
	} catch {
		_registry = fallback;
	}
	return _registry;
}

import { createRequire } from 'node:module';
import * as clack from '@clack/prompts';
import ci from 'ci-info';
import { detect, resolveCommand } from 'package-manager-detector';
import colors from 'piccolore';
import { exec } from './exec.js';
const require2 = createRequire(import.meta.url);
const { bold, cyan, dim, magenta } = colors;
async function getPackage(packageName, logger, options, otherDeps = []) {
	try {
		require2.resolve(packageName, { paths: [options.cwd ?? process.cwd()] });
		const packageImport = await import(packageName);
		return packageImport;
	} catch {
		if (options.optional) return void 0;
		let message = `To continue, Astro requires the following dependency to be installed: ${bold(
			packageName,
		)}.`;
		if (ci.isCI) {
			message += ` Packages cannot be installed automatically in CI environments.`;
		}
		logger.info('SKIP_FORMAT', message);
		if (ci.isCI) {
			return void 0;
		}
		const result = await installPackage([packageName, ...otherDeps], options, logger);
		if (result) {
			const packageImport = await import(packageName);
			return packageImport;
		} else {
			return void 0;
		}
	}
}
async function installPackage(packageNames, options, logger) {
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
		packageNames = packageNames.map((name) => `npm:${name}`);
	}
	const coloredOutput = `${bold(installCommand.command)} ${installCommand.args.join(' ')} ${cyan(packageNames.join(' '))}`;
	logger.info(
		'SKIP_FORMAT',
		`
  ${magenta('Astro will run the following command:')}
  ${dim('If you skip this step, you can always run it yourself later')}`,
	);
	clack.box(coloredOutput, void 0, {
		rounded: true,
		withGuide: false,
		width: 'auto',
	});
	let response;
	if (options.skipAsk) {
		response = true;
	} else {
		response =
			(await clack.confirm({
				message: colors.bold('Continue?'),
				initialValue: true,
				withGuide: false,
			})) === true;
	}
	if (Boolean(response)) {
		const spinner = clack.spinner({ withGuide: false });
		spinner.start('Installing dependencies...');
		try {
			await exec(installCommand.command, [...installCommand.args, ...packageNames], {
				nodeOptions: {
					cwd,
					// reset NODE_ENV to ensure install command run in dev mode
					env: { NODE_ENV: void 0 },
				},
			});
			spinner.stop('Dependencies installed.');
			return true;
		} catch (err) {
			logger.debug('add', 'Error installing dependencies', err);
			spinner.error('Failed to install dependencies.');
			return false;
		}
	} else {
		return false;
	}
}
async function fetchPackageJson(scope, name, tag) {
	const packageName = `${scope ? `${scope}/` : ''}${name}`;
	const registry = await getRegistry();
	const res = await fetch(`${registry}/${packageName}/${tag}`);
	if (res.status >= 200 && res.status < 300) {
		return await res.json();
	} else if (res.status === 404) {
		return new Error();
	} else {
		return new Error(`Failed to fetch ${registry}/${packageName}/${tag} - GET ${res.status}`);
	}
}
async function fetchPackageVersions(packageName) {
	const registry = await getRegistry();
	const res = await fetch(`${registry}/${packageName}`, {
		headers: { accept: 'application/vnd.npm.install-v1+json' },
	});
	if (res.status >= 200 && res.status < 300) {
		return await res.json().then((data) => Object.keys(data.versions));
	} else if (res.status === 404) {
		return new Error();
	} else {
		return new Error(`Failed to fetch ${registry}/${packageName} - GET ${res.status}`);
	}
}
let _registry;
async function getRegistry() {
	if (_registry) return _registry;
	const fallback = 'https://registry.npmjs.org';
	const packageManager = (await detect())?.name || 'npm';
	try {
		const { stdout } = await exec(packageManager, ['config', 'get', 'registry']);
		_registry = stdout.trim()?.replace(/\/$/, '') || fallback;
		if (!new URL(_registry).host) _registry = fallback;
	} catch {
		_registry = fallback;
	}
	return _registry;
}
export { fetchPackageJson, fetchPackageVersions, getPackage };

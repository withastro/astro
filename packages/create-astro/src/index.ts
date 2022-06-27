/* eslint no-console: 'off' */
import degit from 'degit';
import { execa, execaCommand } from 'execa';
import fs from 'fs';
import { bgCyan, black, bold, cyan, dim, gray, green, red, yellow } from 'kleur/colors';
import ora from 'ora';
import path from 'path';
import prompts from 'prompts';
import yargs from 'yargs-parser';
import { loadWithRocketGradient, rocketAscii } from './gradient.js';
import { defaultLogLevel, logger } from './logger.js';
import { TEMPLATES } from './templates.js';

function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function logAndWait(message: string, ms: number = 100) {
	console.log(message);
	return wait(ms);
}
// NOTE: In the v7.x version of npm, the default behavior of `npm init` was changed
// to no longer require `--` to pass args and instead pass `--` directly to us. This
// broke our arg parser, since `--` is a special kind of flag. Filtering for `--` here
// fixes the issue so that create-astro now works on all npm version.
const cleanArgv = process.argv.filter((arg) => arg !== '--');
const args = yargs(cleanArgv);
prompts.override(args);

export function mkdirp(dir: string) {
	try {
		fs.mkdirSync(dir, { recursive: true });
	} catch (e: any) {
		if (e.code === 'EEXIST') return;
		throw e;
	}
}

function isEmpty(dirPath: string) {
	return !fs.existsSync(dirPath) || fs.readdirSync(dirPath).length === 0;
}

const { version } = JSON.parse(
	fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
);

const FILES_TO_REMOVE = ['.stackblitzrc', 'sandbox.config.json', 'CHANGELOG.md']; // some files are only needed for online editors when using astro.new. Remove for create-astro installs.

export async function main() {
	const pkgManager = pkgManagerFromUserAgent(process.env.npm_config_user_agent);

	logger.debug('Verbose logging turned on');
	console.log(`\n${bold('Welcome to Astro!')} ${gray(`(create-astro v${version})`)}`);
	console.log(`Lets walk through setting up your new Astro project.\n`);

	let cwd = args['_'][2] as string;

	if (cwd && isEmpty(cwd)) {
		let acknowledgeProjectDir = ora({
			color: 'green',
			text: `Using ${bold(cwd)} as project directory.`,
		});
		acknowledgeProjectDir.succeed();
	}

	if (!cwd || !isEmpty(cwd)) {
		const notEmptyMsg = (dirPath: string) => `"${bold(dirPath)}" is not empty!`;

		if (!isEmpty(cwd)) {
			let rejectProjectDir = ora({ color: 'red', text: notEmptyMsg(cwd) });
			rejectProjectDir.fail();
		}
		const dirResponse = await prompts({
			type: 'text',
			name: 'directory',
			message: 'Where would you like to create your new project?',
			initial: './my-astro-site',
			validate(value) {
				if (!isEmpty(value)) {
					return notEmptyMsg(value);
				}
				return true;
			},
		});
		cwd = dirResponse.directory;
	}

	if (!cwd) {
		process.exit(1);
	}

	const options = await prompts([
		{
			type: 'select',
			name: 'template',
			message: 'Which template would you like to use?',
			choices: TEMPLATES,
		},
	]);

	if (!options.template) {
		process.exit(1);
	}

	const templateSpinner = await loadWithRocketGradient('Copying project files...');

	const hash = args.commit ? `#${args.commit}` : '';

	const templateTarget = `withastro/astro/examples/${options.template}#latest`;

	const emitter = degit(`${templateTarget}${hash}`, {
		cache: false,
		force: true,
		verbose: defaultLogLevel === 'debug' ? true : false,
	});

	logger.debug('Initialized degit with following config:', `${templateTarget}${hash}`, {
		cache: false,
		force: true,
		verbose: defaultLogLevel === 'debug' ? true : false,
	});

	// Copy
	if (!args.dryRun) {
		try {
			emitter.on('info', (info) => {
				logger.debug(info.message);
			});
			await emitter.clone(cwd);
		} catch (err: any) {
			// degit is compiled, so the stacktrace is pretty noisy. Only report the stacktrace when using verbose mode.
			logger.debug(err);
			console.error(red(err.message));

			// Warning for issue #655
			if (err.message === 'zlib: unexpected end of file') {
				console.log(
					yellow(
						"This seems to be a cache related problem. Remove the folder '~/.degit/github/withastro' to fix this error."
					)
				);
				console.log(
					yellow(
						'For more information check out this issue: https://github.com/withastro/astro/issues/655'
					)
				);
			}

			// Helpful message when encountering the "could not find commit hash for ..." error
			if (err.code === 'MISSING_REF') {
				console.log(
					yellow(
						"This seems to be an issue with degit. Please check if you have 'git' installed on your system, and install it if you don't have (https://git-scm.com)."
					)
				);
				console.log(
					yellow(
						"If you do have 'git' installed, please run this command with the --verbose flag and file a new issue with the command output here: https://github.com/withastro/astro/issues"
					)
				);
			}
			templateSpinner.fail();
			process.exit(1);
		}

		// Post-process in parallel
		await Promise.all(
			FILES_TO_REMOVE.map(async (file) => {
				const fileLoc = path.resolve(path.join(cwd, file));
				if (fs.existsSync(fileLoc)) {
					return fs.promises.rm(fileLoc, {});
				}
			})
		);
	}

	templateSpinner.text = green('Template copied!');
	templateSpinner.succeed();

	const installResponse = await prompts({
		type: 'confirm',
		name: 'install',
		message: `Would you like us to run "${pkgManager} install?"`,
		initial: true,
	});

	if (args.dryRun) {
		ora().info(dim(`--dry-run enabled, skipping.`));
	} else if (installResponse.install) {
		const installExec = execa(pkgManager, ['install'], { cwd });
		const installingPackagesMsg = `Installing packages${emojiWithFallback(' 📦', '...')}`;
		const installSpinner = await loadWithRocketGradient(installingPackagesMsg);
		await new Promise<void>((resolve, reject) => {
			installExec.stdout?.on('data', function (data) {
				installSpinner.text = `${rocketAscii} ${installingPackagesMsg}\n${bold(
					`[${pkgManager}]`
				)} ${data}`;
			});
			installExec.on('error', (error) => reject(error));
			installExec.on('close', () => resolve());
		});
		installSpinner.text = green('Packages installed!');
		installSpinner.succeed();
	} else {
		ora().info(dim(`No problem! You can install dependencies yourself after setup.`));
	}

	const gitResponse = await prompts({
		type: 'confirm',
		name: 'git',
		message: `Initialize a new git repository? ${dim('This can be useful to track changes.')}`,
		initial: true,
	});

	if (args.dryRun) {
		ora().info(dim(`--dry-run enabled, skipping.`));
	} else if (gitResponse.git) {
		await execaCommand('git init', { cwd });
	} else {
		ora().info(
			dim(`Sounds good! You can come back and run ${cyan(`git init`)} later.`)
		);
	}

	ora().succeed('Setup complete.');
	ora({ text: green('Ready for liftoff!') }).succeed();
	await wait(300);

	console.log(`\n${bgCyan(black(' Next steps '))}\n`);

	let projectDir = path.relative(process.cwd(), cwd);
	const devCmd = pkgManager === 'npm' ? 'npm run dev' : `${pkgManager} dev`;

	await logAndWait(
		`You can now ${bold(cyan('cd'))} into the ${bold(cyan(projectDir))} project directory.`
	);
	await logAndWait(
		`Run ${bold(cyan(devCmd))} to start the Astro dev server. ${bold(cyan('CTRL-C'))} to close.`
	);
	await logAndWait(
		`Add frameworks like ${bold(cyan('react'))} and ${bold(
			cyan('tailwind')
		)} to your project using ${bold(cyan('astro add'))}`
	);
	await logAndWait('');
	await logAndWait(`Stuck? Come join us at ${bold(cyan('https://astro.build/chat'))}`, 1000);
	await logAndWait(dim('Good luck out there, astronaut.'));
	await logAndWait('', 300);
}

function emojiWithFallback(char: string, fallback: string) {
	return process.platform !== 'win32' ? char : fallback;
}

function pkgManagerFromUserAgent(userAgent?: string) {
	if (!userAgent) return 'npm';
	const pkgSpec = userAgent.split(' ')[0];
	const pkgSpecArr = pkgSpec.split('/');
	return pkgSpecArr[0];
}

function pkgManagerExecCommand(pkgManager: string) {
	if (pkgManager === 'pnpm') {
		return 'pnpx';
	} else {
		// note: yarn does not have an "npx" equivalent
		return 'npx';
	}
}

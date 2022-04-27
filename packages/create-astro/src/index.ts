import fs from 'fs';
import path from 'path';
import { bold, cyan, gray, green, red, yellow } from 'kleur/colors';
import prompts from 'prompts';
import degit from 'degit';
import yargs from 'yargs-parser';
import ora from 'ora';
import { TEMPLATES } from './templates.js';
import { logger, defaultLogLevel } from './logger.js';
import { execa, execaCommand } from 'execa';

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

	let spinner = ora({ color: 'green', text: 'Prepare for liftoff.' });

	spinner.succeed();

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
			message: 'Where would you like to create your app?',
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
			message: 'Which app template would you like to use?',
			choices: TEMPLATES,
		},
	]);

	if (!options.template) {
		process.exit(1);
	}

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

	spinner = ora({ color: 'green', text: 'Copying project files...' }).start();

	// Copy
	if (!args.dryrun) {
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
			spinner.fail();
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

	spinner.succeed();
	console.log(bold(green('✔') + ' Done!'));

	const installResponse = await prompts({
		type: 'confirm',
		name: 'install',
		message: `Would you like us to run "${pkgManager} install?"`,
		initial: true,
	});

	if (!installResponse) {
		process.exit(0);
	}

	if (installResponse.install) {
		const installExec = execa(pkgManager, ['install'], { cwd });
		const installingPackagesMsg = `Installing packages${emojiWithFallback(' 📦', '...')}`;
		spinner = ora({ color: 'green', text: installingPackagesMsg }).start();
		if (!args.dryrun) {
			await new Promise<void>((resolve, reject) => {
				installExec.stdout?.on('data', function (data) {
					spinner.text = `${installingPackagesMsg}\n${bold(`[${pkgManager}]`)} ${data}`;
				});
				installExec.on('error', (error) => reject(error));
				installExec.on('close', () => resolve());
			});
		}
		spinner.succeed();
	}

	const astroAddCommand = installResponse.install
		? 'astro add --yes'
		: `${pkgManagerExecCommand(pkgManager)} astro@latest add --yes`;

	const astroAddResponse = await prompts({
		type: 'confirm',
		name: 'astroAdd',
		message: `Run "${astroAddCommand}?" This lets you optionally add component frameworks (ex. React), CSS frameworks (ex. Tailwind), and more.`,
		initial: true,
	});

	if (!astroAddResponse) {
		process.exit(0);
	}

	if (!astroAddResponse.astroAdd) {
		ora().info(
			`No problem. You can always run "${pkgManagerExecCommand(pkgManager)} astro add" later!`
		);
	}

	if (astroAddResponse.astroAdd && !args.dryrun) {
		await execaCommand(
			astroAddCommand,
			astroAddCommand === 'astro add --yes'
				? { cwd, stdio: 'inherit', localDir: cwd, preferLocal: true }
				: { cwd, stdio: 'inherit' }
		);
	}

	console.log('\nNext steps:');
	let i = 1;
	const relative = path.relative(process.cwd(), cwd);
	if (relative !== '') {
		console.log(`  ${i++}: ${bold(cyan(`cd ${relative}`))}`);
	}

	if (!installResponse.install) {
		console.log(`  ${i++}: ${bold(cyan(`${pkgManager} install`))}`);
	}
	console.log(
		`  ${i++}: ${bold(
			cyan('git init && git add -A && git commit -m "Initial commit"')
		)} (optional step)`
	);
	const runCommand = pkgManager === 'npm' ? 'npm run dev' : `${pkgManager} dev`;
	console.log(`  ${i++}: ${bold(cyan(runCommand))}`);

	console.log(`\nTo close the dev server, hit ${bold(cyan('Ctrl-C'))}`);
	console.log(`\nStuck? Visit us at ${cyan('https://astro.build/chat')}\n`);
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

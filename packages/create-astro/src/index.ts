/* eslint no-console: 'off' */
import { color, generateProjectName, label, say } from '@astrojs/cli-kit';
import { forceUnicode, random } from '@astrojs/cli-kit/utils';
import { assign, parse, stringify } from 'comment-json';
import { execa, execaCommand } from 'execa';
import fs from 'fs';
import { downloadTemplate } from 'giget';
import { bold, dim, green, reset, yellow } from 'kleur/colors';
import ora from 'ora';
import path from 'path';
import prompts from 'prompts';
import detectPackageManager from 'which-pm-runs';
import yargs from 'yargs-parser';
import { loadWithRocketGradient, rocketAscii } from './gradient.js';
import { logger } from './logger.js';
import {
	banner,
	getName,
	getVersion,
	info,
	nextSteps,
	typescriptByDefault,
	welcome,
} from './messages.js';
import { TEMPLATES } from './templates.js';

// NOTE: In the v7.x version of npm, the default behavior of `npm init` was changed
// to no longer require `--` to pass args and instead pass `--` directly to us. This
// broke our arg parser, since `--` is a special kind of flag. Filtering for `--` here
// fixes the issue so that create-astro now works on all npm version.
const cleanArgv = process.argv.filter((arg) => arg !== '--');
const args = yargs(cleanArgv, { boolean: ['fancy'] });
prompts.override(args);

// Enable full unicode support if the `--fancy` flag is passed
if (args.fancy) {
	forceUnicode();
}

export function mkdirp(dir: string) {
	try {
		fs.mkdirSync(dir, { recursive: true });
	} catch (e: any) {
		if (e.code === 'EEXIST') return;
		throw e;
	}
}

// Some existing files and directories can be safely ignored when checking if a directory is a valid project directory.
// https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/create-react-app/createReactApp.js#L907-L934
const VALID_PROJECT_DIRECTORY_SAFE_LIST = [
	'.DS_Store',
	'.git',
	'.gitattributes',
	'.gitignore',
	'.gitlab-ci.yml',
	'.hg',
	'.hgcheck',
	'.hgignore',
	'.idea',
	'.npmignore',
	'.travis.yml',
	'.yarn',
	'.yarnrc.yml',
	'docs',
	'LICENSE',
	'mkdocs.yml',
	'Thumbs.db',
	/\.iml$/,
	/^npm-debug\.log/,
	/^yarn-debug\.log/,
	/^yarn-error\.log/,
];

function isValidProjectDirectory(dirPath: string) {
	if (!fs.existsSync(dirPath)) {
		return true;
	}

	const conflicts = fs.readdirSync(dirPath).filter((content) => {
		return !VALID_PROJECT_DIRECTORY_SAFE_LIST.some((safeContent) => {
			return typeof safeContent === 'string' ? content === safeContent : safeContent.test(content);
		});
	});

	return conflicts.length === 0;
}

const FILES_TO_REMOVE = ['.stackblitzrc', 'sandbox.config.json', 'CHANGELOG.md']; // some files are only needed for online editors when using astro.new. Remove for create-astro installs.

// Please also update the installation instructions in the docs at https://github.com/withastro/docs/blob/main/src/pages/en/install/auto.md if you make any changes to the flow or wording here.
export async function main() {
	const pkgManager = detectPackageManager()?.name || 'npm';
	const [username, version] = await Promise.all([getName(), getVersion()]);

	logger.debug('Verbose logging turned on');
	if (!args.skipHouston) {
		await say(
			[
				[
					'Welcome',
					'to',
					label('astro', color.bgGreen, color.black),
					color.green(`v${version}`) + ',',
					`${username}!`,
				],
				random(welcome),
			],
			{ hat: args.fancy ? '🎩' : undefined }
		);
		await banner(version);
	}

	let cwd = args['_'][2] as string;

	if (cwd && isValidProjectDirectory(cwd)) {
		let acknowledgeProjectDir = ora({
			color: 'green',
			text: `Using ${bold(cwd)} as project directory.`,
		});
		acknowledgeProjectDir.succeed();
	}

	if (!cwd || !isValidProjectDirectory(cwd)) {
		const notEmptyMsg = (dirPath: string) => `"${bold(dirPath)}" is not empty!`;

		if (!isValidProjectDirectory(cwd)) {
			let rejectProjectDir = ora({ color: 'red', text: notEmptyMsg(cwd) });
			rejectProjectDir.fail();
		}
		const dirResponse = await prompts(
			{
				type: 'text',
				name: 'directory',
				message: 'Where would you like to create your new project?',
				initial: generateProjectName(),
				validate(value) {
					if (!isValidProjectDirectory(value)) {
						return notEmptyMsg(value);
					}
					return true;
				},
			},
			{ onCancel: () => ora().info(dim('Operation cancelled. See you later, astronaut!')) }
		);
		cwd = dirResponse.directory;
	}

	if (!cwd) {
		ora().info(dim('No directory provided. See you later, astronaut!'));
		process.exit(1);
	}

	const options = await prompts(
		[
			{
				type: 'select',
				name: 'template',
				message: 'How would you like to setup your new project?',
				choices: TEMPLATES,
			},
		],
		{ onCancel: () => ora().info(dim('Operation cancelled. See you later, astronaut!')) }
	);

	if (!options.template) {
		ora().info(dim('No template provided. See you later, astronaut!'));
		process.exit(1);
	}

	let templateSpinner = await loadWithRocketGradient('Copying project files...');

	const hash = args.commit ? `#${args.commit}` : '';

	const isThirdParty = options.template.includes('/');
	const templateTarget = isThirdParty
		? options.template
		: `withastro/astro/examples/${options.template}#latest`;

	// Copy
	if (!args.dryRun) {
		try {
			await downloadTemplate(`${templateTarget}${hash}`, {
				force: true,
				provider: 'github',
				cwd,
				dir: '.',
			});
		} catch (err: any) {
			fs.rmdirSync(cwd);
			if (err.message.includes('404')) {
				console.error(`Template ${color.underline(options.template)} does not exist!`);
			} else {
				console.error(err.message);
			}
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

	const installResponse = await prompts(
		{
			type: 'confirm',
			name: 'install',
			message: `Would you like to install ${pkgManager} dependencies? ${reset(
				dim('(recommended)')
			)}`,
			initial: true,
		},
		{
			onCancel: () => {
				ora().info(
					dim(
						'Operation cancelled. Your project folder has already been created, however no dependencies have been installed'
					)
				);
				process.exit(1);
			},
		}
	);

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
		await info('No problem!', 'Remember to install dependencies after setup.');
	}

	const gitResponse = await prompts(
		{
			type: 'confirm',
			name: 'git',
			message: `Would you like to initialize a new git repository? ${reset(dim('(optional)'))}`,
			initial: true,
		},
		{
			onCancel: () => {
				ora().info(
					dim('Operation cancelled. No worries, your project folder has already been created')
				);
				process.exit(1);
			},
		}
	);

	if (args.dryRun) {
		ora().info(dim(`--dry-run enabled, skipping.`));
	} else if (gitResponse.git) {
		await execaCommand('git init', { cwd });
		ora().succeed('Git repository created!');
	} else {
		await info(
			'Sounds good!',
			`You can come back and run ${color.reset(`git init`)}${color.dim(' later.')}`
		);
	}

	const tsResponse = await prompts(
		{
			type: 'select',
			name: 'typescript',
			message: 'How would you like to setup TypeScript?',
			choices: [
				{ value: 'strict', title: 'Strict', description: '(recommended)' },
				{ value: 'strictest', title: 'Strictest' },
				{ value: 'base', title: 'Relaxed' },
				{ value: 'unsure', title: 'Help me choose' },
			],
		},
		{
			onCancel: () => {
				ora().info(
					dim(
						'Operation cancelled. Your project folder has been created but no TypeScript configuration file was created.'
					)
				);
				process.exit(1);
			},
		}
	);

	if (tsResponse.typescript === 'unsure') {
		await typescriptByDefault();
		tsResponse.typescript = 'base';
	}
	if (args.dryRun) {
		ora().info(dim(`--dry-run enabled, skipping.`));
	} else if (tsResponse.typescript) {
		const templateTSConfigPath = path.join(cwd, 'tsconfig.json');
		fs.readFile(templateTSConfigPath, (err, data) => {
			if (err && err.code === 'ENOENT') {
				// If the template doesn't have a tsconfig.json, let's add one instead
				fs.writeFileSync(
					templateTSConfigPath,
					stringify({ extends: `astro/tsconfigs/${tsResponse.typescript}` }, null, 2)
				);

				return;
			}

			const templateTSConfig = parse(data.toString());

			if (templateTSConfig && typeof templateTSConfig === 'object') {
				const result = assign(templateTSConfig, {
					extends: `astro/tsconfigs/${tsResponse.typescript}`,
				});

				fs.writeFileSync(templateTSConfigPath, stringify(result, null, 2));
			} else {
				console.log(
					yellow(
						"There was an error applying the requested TypeScript settings. This could be because the template's tsconfig.json is malformed"
					)
				);
			}
		});
		ora().succeed('TypeScript settings applied!');
	}

	let projectDir = path.relative(process.cwd(), cwd);
	const devCmd = pkgManager === 'npm' ? 'npm run dev' : `${pkgManager} dev`;
	await nextSteps({ projectDir, devCmd });

	if (!args.skipHouston) {
		await say(['Good luck out there, astronaut!']);
	}
}

function emojiWithFallback(char: string, fallback: string) {
	return process.platform !== 'win32' ? char : fallback;
}

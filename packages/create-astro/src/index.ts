import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { bold, cyan, gray, green, red, yellow } from 'kleur/colors';
import prompts from 'prompts';
import degit from 'degit';
import yargs from 'yargs-parser';
import ora from 'ora';
import { TEMPLATES } from './templates.js';
import { logger, defaultLogLevel } from './logger.js';

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

const POSTPROCESS_FILES = ['package.json', 'astro.config.mjs', 'CHANGELOG.md']; // some files need processing after copying.

export async function main() {
	logger.debug('Verbose logging turned on');
	console.log(`\n${bold('Welcome to Astro!')} ${gray(`(create-astro v${version})`)}`);
	console.log(
		`If you encounter a problem, visit ${cyan(
			'https://github.com/withastro/astro/issues'
		)} to search or file a new issue.\n`
	);

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
		const notEmptyMsg = (dirPath: string) =>
			`"${bold(dirPath)}" is not empty. Please clear contents or choose a different path.`;

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

	const templateTarget = options.template.includes('/')
		? options.template
		: `withastro/astro/examples/${options.template}#latest`;

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
		POSTPROCESS_FILES.map(async (file) => {
			const fileLoc = path.resolve(path.join(cwd, file));

			switch (file) {
				case 'CHANGELOG.md': {
					if (fs.existsSync(fileLoc)) {
						await fs.promises.unlink(fileLoc);
					}
					break;
				}
			}
		})
	);

	spinner.succeed();
	console.log(bold(green('✔') + ' Done!'));

	const selectedTemplate = TEMPLATES.find((template) => template.value === options.template);

	if (selectedTemplate?.value === 'starter') {
		const { integrations } = await prompts({
			type: 'confirm',
			name: 'integrations',
			message: 'Do you need extra integrations (TailwindCSS, component frameworks, etc)?',
			initial: true,
		});

		if (integrations === true) {
			// TODO: finish once we can programmatically npm install
			// astro add fails to parse config when dependencies aren't installed!
			await new Promise<void>((resolve, reject) => {
				const astroAdd = exec(`cd ${cwd} && npx astro@latest add`);
				astroAdd.on('close', () => resolve());
				astroAdd.on('error', (error) => reject(error));
			});
		} else {
			ora({
				color: 'gray',
				text: `You can always run "${bold('npx astro add')}" to add integrations later!`,
			}).info();
		}
	}

	console.log('\nNext steps:');
	let i = 1;
	const relative = path.relative(process.cwd(), cwd);
	if (relative !== '') {
		console.log(`  ${i++}: ${bold(cyan(`cd ${relative}`))}`);
	}

	console.log(`  ${i++}: ${bold(cyan('npm install'))} (or pnpm install, yarn, etc)`);
	console.log(
		`  ${i++}: ${bold(
			cyan('git init && git add -A && git commit -m "Initial commit"')
		)} (optional step)`
	);
	console.log(`  ${i++}: ${bold(cyan('npm run dev'))} (or pnpm, yarn, etc)`);

	console.log(`\nTo close the dev server, hit ${bold(cyan('Ctrl-C'))}`);
	console.log(`\nStuck? Visit us at ${cyan('https://astro.build/chat')}\n`);
}

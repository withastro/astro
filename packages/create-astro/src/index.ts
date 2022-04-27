import fs from 'fs';
import path from 'path';
import { bold, cyan, gray, green, red, yellow } from 'kleur/colors';
import fetch from 'node-fetch';
import prompts from 'prompts';
import degit from 'degit';
import yargs from 'yargs-parser';
import ora from 'ora';
import { FRAMEWORKS, COUNTER_COMPONENTS, Integration } from './frameworks.js';
import { TEMPLATES } from './templates.js';
import { createConfig } from './config.js';
import { logger, defaultLogLevel } from './logger.js';
import { execa } from 'execa';

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

const FILES_TO_REMOVE = ['.stackblitzrc', 'sandbox.config.json']; // some files are only needed for online editors when using astro.new. Remove for create-astro installs.
const POSTPROCESS_FILES = ['package.json', 'astro.config.mjs', 'CHANGELOG.md']; // some files need processing after copying.

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

	const selectedTemplate = TEMPLATES.find((template) => template.value === options.template);
	let integrations: Integration[] = [];

	if (selectedTemplate?.integrations === true) {
		const result = await prompts([
			{
				type: 'multiselect',
				name: 'integrations',
				message: 'Which frameworks would you like to use?',
				choices: FRAMEWORKS,
			},
		]);
		integrations = result.integrations;
	}

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
		await Promise.all([
			...FILES_TO_REMOVE.map(async (file) => {
				const fileLoc = path.resolve(path.join(cwd, file));
				return fs.promises.rm(fileLoc);
			}),
			...POSTPROCESS_FILES.map(async (file) => {
				const fileLoc = path.resolve(path.join(cwd, file));

				switch (file) {
					case 'CHANGELOG.md': {
						if (fs.existsSync(fileLoc)) {
							await fs.promises.unlink(fileLoc);
						}
						break;
					}
					case 'astro.config.mjs': {
						if (selectedTemplate?.integrations !== true) {
							break;
						}
						await fs.promises.writeFile(fileLoc, createConfig({ integrations }));
						break;
					}
					case 'package.json': {
						const packageJSON = JSON.parse(await fs.promises.readFile(fileLoc, 'utf8'));
						delete packageJSON.snowpack; // delete snowpack config only needed in monorepo (can mess up projects)
						// Fetch latest versions of selected integrations
						const integrationEntries = (
							await Promise.all(
								integrations.map((integration) =>
									fetch(`https://registry.npmjs.org/${integration.packageName}/latest`)
										.then((res) => res.json())
										.then((res: any) => {
											let dependencies: [string, string][] = [[res['name'], `^${res['version']}`]];

											if (res['peerDependencies']) {
												for (const peer in res['peerDependencies']) {
													dependencies.push([peer, res['peerDependencies'][peer]]);
												}
											}

											return dependencies;
										})
								)
							)
						).flat(1);
						// merge and sort dependencies
						packageJSON.devDependencies = {
							...(packageJSON.devDependencies ?? {}),
							...Object.fromEntries(integrationEntries),
						};
						packageJSON.devDependencies = Object.fromEntries(
							Object.entries(packageJSON.devDependencies).sort((a, b) => a[0].localeCompare(b[0]))
						);
						await fs.promises.writeFile(fileLoc, JSON.stringify(packageJSON, undefined, 2));
						break;
					}
				}
			}),
		]);

		// Inject framework components into starter template
		if (selectedTemplate?.value === 'starter') {
			let importStatements: string[] = [];
			let components: string[] = [];
			await Promise.all(
				integrations.map(async (integration) => {
					const component = COUNTER_COMPONENTS[integration.id as keyof typeof COUNTER_COMPONENTS];
					const componentName = path.basename(component.filename, path.extname(component.filename));
					const absFileLoc = path.resolve(cwd, component.filename);
					importStatements.push(
						`import ${componentName} from '${component.filename.replace(/^src/, '..')}';`
					);
					components.push(`<${componentName} client:visible />`);
					await fs.promises.writeFile(absFileLoc, component.content);
				})
			);

			const pageFileLoc = path.resolve(path.join(cwd, 'src', 'pages', 'index.astro'));
			const content = (await fs.promises.readFile(pageFileLoc)).toString();
			const newContent = content
				.replace(/^(\s*)\/\* ASTRO\:COMPONENT_IMPORTS \*\//gm, (_, indent) => {
					return indent + importStatements.join('\n');
				})
				.replace(/^(\s*)<!-- ASTRO:COMPONENT_MARKUP -->/gm, (_, indent) => {
					return components.map((ln) => indent + ln).join('\n');
				});
			await fs.promises.writeFile(pageFileLoc, newContent);
		}
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

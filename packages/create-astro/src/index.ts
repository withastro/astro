/* eslint no-console: 'off' */
import path from 'node:path';
import yargs from 'yargs-parser';
import detectPackageManager from 'which-pm-runs';
import { say, label, color, prompt, generateProjectName, spinner } from '@astrojs/cli-kit';
import { random, align } from '@astrojs/cli-kit/utils';

import { banner, getName, getVersion, welcome, info, typescriptByDefault, nextSteps } from './messages.js';
import { isEmpty, toValidName } from './actions/shared.js';
import checkCwd from './actions/check-cwd.js';
import copyTemplate from './actions/copy-template.js';
import installDeps from './actions/install-deps.js';
import initializeGit from './actions/initialize-git.js';
import setupTypeScript from './actions/setup-typescript.js';

// NOTE: In the v7.x version of npm, the default behavior of `npm init` was changed
// to no longer require `--` to pass args and instead pass `--` directly to us. This
// broke our arg parser, since `--` is a special kind of flag. Filtering for `--` here
// fixes the issue so that create-astro now works on all npm versions.
const cleanArgv = process.argv.filter((arg) => arg !== '--');
const flags = yargs(cleanArgv, { boolean: ['yes', 'no', 'install', 'git', 'skip-houston'], alias: { 'y': 'yes', 'n': 'no' }});

const title = (text: string) => align(label(text), 'end', 7) + ' ';

// Please also update the installation instructions in the docs at https://github.com/withastro/docs/blob/main/src/pages/en/install/auto.md if you make any changes to the flow or wording here.
export async function main() {
	const pkgManager = detectPackageManager()?.name ?? 'npm';
	const [username, version] = await Promise.all([getName(), getVersion()]);
	let cwd = flags['_'][2] as string;
	let { template, no, yes, install, git: init, typescript, skipHouston } = flags;
	let projectName = cwd;

	if (no) {
		yes = false;
		install = false;
		init = false;
		typescript = 'strict';
	}

	skipHouston = skipHouston ?? [yes, no, install, init, typescript].some(v => v !== undefined);

	if (!skipHouston) {
		await say([
			['Welcome', 'to', label('astro', color.bgGreen, color.black), color.green(`v${version}`) + ',', `${username}!`],
			random(welcome),
		]);	
		await banner(version);
	} else {
		console.log('');
		await banner(version);
	}

	await checkCwd(cwd);

	if (!cwd || !isEmpty(cwd)) {
		if (!isEmpty(cwd)) {
			await info('Hmm...', `${color.reset(`"${cwd}"`)}${color.dim(` is not empty!`)}`);
		}

		const { name } = await prompt({
			name: 'name',
			type: 'text',
			label: title('dir'),
			message: 'Where should we create your new project?',
			initial: `./${generateProjectName()}`,
			validate(value: string) {
				if (!isEmpty(value)) {
					return `Directory is not empty!`;
				}
				return true;
			},
		});
		cwd = name!;
		projectName = toValidName(name!);
	}

	if (!cwd) {
		process.exit(1);
	}

	if (!template) {
		({ template } = await prompt({
			name: 'template',
			type: 'select',
			label: title('tmpl'),
			message: 'How would you like to start your new project?',
			initial: 'basics',
			choices: [
				{ value: 'basics', label: 'Include sample files', hint: '(recommended)' },
				{ value: 'blog', label: 'Use blog template' },
				{ value: 'minimal', label: 'Empty' },
			],
		}));
	} else {
		await info('tmpl', `Using ${color.reset(template)}${color.dim(' as project template')}`)
	}

	if (flags.dryRun) {
		await info('--dry-run', `Skipping template copying`);
	} else if (template) {
		await spinner({
			start: 'Template copying...',
			end: 'Template copied',
			while: () => copyTemplate(template, { name: projectName, flags, cwd, pkgManager })
		})
	} else {
		process.exit(1)
	}

	let deps = install ?? yes;
	if (deps === undefined) {
		({ deps } = await prompt({
			name: 'deps',
			type: 'confirm',
			label: title('deps'),
			message: `Install dependencies?`,
			hint: 'recommended',
			initial: true
		}));
	}
	
	if (flags.dryRun) {
		await info('--dry-run', `Skipping dependency installation`);
	} else if (deps) {
			await spinner({ start: `Dependencies installing with ${pkgManager}...`, end: 'Dependencies installed', while: () => installDeps({ pkgManager, cwd }) });
	} else {
			await info(typeof install === 'boolean' ? 'deps [skip]' : 'No problem!', 'Remember to install dependencies after setup.')
	}

	let git = init ?? yes;
	if (git === undefined) {
		({ git } = await prompt({
			name: 'git',
			type: 'confirm',
			label: title('git'),
			message: `Initialize a new git repository?`,
			hint: 'optional',
			initial: true
		}))
	}

	if (flags.dryRun) {
		await info('--dry-run', `Skipping Git initialization`);
	} else if (git) {
			await spinner({ start: 'Git initializing...', end: 'Git initialized', while: () => initializeGit({ cwd }) });
	} else {
			await info(typeof init === 'boolean' ? 'git [skip]' : 'Sounds good!', `You can always run ${color.reset('git init')}${color.dim(' manually.')}`)
	}

	let ts = typescript ?? yes ? 'strict' : yes;
	if (ts === undefined) {
		({ ts } = await prompt({
			name: 'ts',
			type: 'select',
			label: title('ts'),
			message: `Customize TypeScript?`,
			initial: 'strict',
			choices: [
					{ value: 'strict', label: 'Strict', hint: `(recommended)` },
					{ value: 'strictest', label: 'Strictest' },
					{ value: 'default', label: 'Relaxed' },
					{ value: 'unsure', label: `Hmm... I'm not sure` },
			]
		}))
	} else if (!yes) {
		await info('ts', `Using ${color.reset(typescript)}${color.dim(' TypeScript configuration')}`)
	}

	if (flags.dryRun) {
		await info('--dry-run', `Skipping TypeScript setup`);
	} else if (ts && ts !== 'unsure') {
		if (ts === 'relaxed') {
			ts = 'default'
		}
		await spinner({ start: 'TypeScript customizing...', end: 'TypeScript customized', while: () => setupTypeScript(ts, { cwd }) });
	} else {
			await typescriptByDefault();
	}

	let projectDir = path.relative(process.cwd(), cwd);
	const devCmd = pkgManager === 'npm' ? 'npm run dev' : `${pkgManager} dev`;
	await nextSteps({ projectDir, devCmd });
	
	await say(['Good luck out there, astronaut! 🚀']);

	process.exit(0);
}

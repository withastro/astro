import os from 'node:os';
import { parseArgs } from 'node:util';
import { type Task, prompt } from '@astrojs/cli-kit';
import { random } from '@astrojs/cli-kit/utils';

import getSeasonalData from '../data/seasonal.js';
import { getName, getVersion } from '../messages.js';

export interface Context {
	help: boolean;
	prompt: typeof prompt;
	cwd: string;
	packageManager: string;
	username: Promise<string>;
	version: Promise<string>;
	skipHouston: boolean;
	fancy?: boolean;
	dryRun?: boolean;
	yes?: boolean;
	projectName?: string;
	template?: string;
	ref: string;
	install?: boolean;
	git?: boolean;
	typescript?: string;
	stdin?: typeof process.stdin;
	stdout?: typeof process.stdout;
	exit(code: number): never;
	welcome?: string;
	hat?: string;
	tie?: string;
	tasks: Task[];
}

export async function getContext(argv: string[]): Promise<Context> {
	const args = parseArgs({
		args: argv,
		allowPositionals: true,
		strict: false,
		options: {
			template: { type: 'string' },
			ref: { type: 'string' },
			yes: { type: 'boolean', short: 'y' },
			no: { type: 'boolean', short: 'n' },
			install: { type: 'boolean' },
			'no-install': { type: 'boolean' },
			git: { type: 'boolean' },
			'no-git': { type: 'boolean' },
			typescript: { type: 'string' },
			'skip-houston': { type: 'boolean' },
			'dry-run': { type: 'boolean' },
			help: { type: 'boolean', short: 'h' },
			fancy: { type: 'boolean' },
		},
	});

	const packageManager = detectPackageManager() ?? 'npm';
	const projectName = args.positionals[0];
	let {
		help,
		template,
		no,
		yes,
		install,
		'no-install': noInstall,
		git,
		'no-git': noGit,
		typescript,
		fancy,
		'skip-houston': skipHouston,
		'dry-run': dryRun,
		ref,
	} = args.values;

	if (no) {
		yes = false;
		if (install == undefined) install = false;
		if (git == undefined) git = false;
		if (typescript == undefined) typescript = 'strict';
	}

	skipHouston = typeof skipHouston == 'boolean' ? skipHouston : undefined;
	skipHouston =
		((os.platform() === 'win32' && !fancy) || skipHouston) ??
		[yes, no, install, git, typescript].some((v) => v !== undefined);

	// We use `strict: false` in `parseArgs` to allow unknown options, but Node also
	// simply doesn't guarantee the types anymore, so we need to validate ourselves :(
	help = !!help;
	template = typeof template == 'string' ? template : undefined;
	no = !!no;
	yes = !!yes;
	install = !!install;
	noInstall = !!noInstall;
	git = !!git;
	noGit = !!noGit;
	typescript = typeof typescript == 'string' ? typescript : undefined;
	fancy = !!fancy;
	dryRun = !!dryRun;
	ref = typeof ref == 'string' ? ref : undefined;

	const { messages, hats, ties } = getSeasonalData({ fancy });

	const context: Context = {
		help,
		prompt,
		packageManager,
		username: getName(),
		version: getVersion(packageManager, 'astro', process.env.ASTRO_VERSION),
		skipHouston,
		fancy,
		dryRun,
		projectName,
		template,
		ref: ref ?? 'latest',
		welcome: random(messages),
		hat: hats ? random(hats) : undefined,
		tie: ties ? random(ties) : undefined,
		yes,
		install: install ?? (noInstall ? false : undefined),
		git: git ?? (noGit ? false : undefined),
		typescript,
		cwd: projectName,
		exit(code) {
			process.exit(code);
		},
		tasks: [],
	};
	return context;
}

function detectPackageManager() {
	if (!process.env.npm_config_user_agent) return;
	const specifier = process.env.npm_config_user_agent.split(' ')[0];
	const name = specifier.substring(0, specifier.lastIndexOf('/'));
	return name === 'npminstall' ? 'cnpm' : name;
}

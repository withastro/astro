import { prompt } from '@astrojs/cli-kit';
import arg from 'arg';
import os from 'node:os';
import detectPackageManager from 'which-pm-runs';

import { getName, getVersion } from '../messages.js';

export interface Context {
	help: boolean;
	prompt: typeof prompt;
	cwd: string;
	pkgManager: string;
	username: string;
	version: string;
	skipHouston: boolean;
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
}

export async function getContext(argv: string[]): Promise<Context> {
	const flags = arg(
		{
			'--template': String,
			'--ref': String,
			'--yes': Boolean,
			'--no': Boolean,
			'--install': Boolean,
			'--no-install': Boolean,
			'--git': Boolean,
			'--no-git': Boolean,
			'--typescript': String,
			'--skip-houston': Boolean,
			'--dry-run': Boolean,
			'--help': Boolean,
			'--fancy': Boolean,

			'-y': '--yes',
			'-n': '--no',
			'-h': '--help',
		},
		{ argv, permissive: true }
	);

	const pkgManager = detectPackageManager()?.name ?? 'npm';
	const [username, version] = await Promise.all([getName(), getVersion()]);
	let cwd = flags['_'][0];
	let {
		'--help': help = false,
		'--template': template,
		'--no': no,
		'--yes': yes,
		'--install': install,
		'--no-install': noInstall,
		'--git': git,
		'--no-git': noGit,
		'--typescript': typescript,
		'--fancy': fancy,
		'--skip-houston': skipHouston,
		'--dry-run': dryRun,
		'--ref': ref,
	} = flags;
	let projectName = cwd;

	if (no) {
		yes = false;
		if (install == undefined) install = false;
		if (git == undefined) git = false;
		if (typescript == undefined) typescript = 'strict';
	}

	skipHouston =
		((os.platform() === 'win32' && !fancy) || skipHouston) ??
		[yes, no, install, git, typescript].some((v) => v !== undefined);

	const context: Context = {
		help,
		prompt,
		pkgManager,
		username,
		version,
		skipHouston,
		dryRun,
		projectName,
		template,
		ref: ref ?? 'latest',
		yes,
		install: install ?? (noInstall ? false : undefined),
		git: git ?? (noGit ? false : undefined),
		typescript,
		cwd,
		exit(code) {
			process.exit(code);
		},
	};
	return context;
}

import os from 'node:os';
import yargs from 'yargs-parser';
import detectPackageManager from 'which-pm-runs';
import { prompt } from '@astrojs/cli-kit';

import { getName, getVersion } from '../messages.js';

export interface Context {
	help: boolean;
	prompt: typeof prompt;
	cwd: string;
	pkgManager: string;
	username: string;
	version: string;
	skipHouston: boolean;
	dryRun: boolean;
	yes?: boolean;
	projectName?: string;
	template?: string;
	ref: string;
	install?: boolean;
	git?: boolean;
	typescript?: string;
}


export async function getContext(argv: string[]): Promise<Context> {
	const flags = yargs(argv, {
		boolean: ['yes', 'no', 'install', 'git', 'skip-houston', 'dry-run', 'help', 'fancy'],
		alias: { y: 'yes', n: 'no', h: 'help' },
	});
	const pkgManager = detectPackageManager()?.name ?? 'npm';
	const [username, version] = await Promise.all([getName(), getVersion()]);
	let cwd = flags['_'][0] as string;
	let {
		help,
		template,
		no,
		yes,
		install,
		git,
		typescript,
		fancy,
		'skip-houston': skipHouston,
		'dry-run': dryRun,
	} = flags;
	let projectName = cwd;

	if (no) {
		yes = false;
		if (install == undefined) install = false;
		if (git == undefined) git = false;
		if (typescript == undefined) typescript = 'strict';
	}

	skipHouston = ((os.platform() === 'win32' && !fancy) || skipHouston) ?? [yes, no, install, git, typescript].some((v) => v !== undefined);
	
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
		ref: flags.ref ?? 'latest',
		yes,
		install,
		git,
		typescript,
		cwd
	}
	return context;
}

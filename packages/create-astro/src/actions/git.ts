import type { Context } from "./context";
import fs from 'node:fs';
import path from 'node:path';

import { color } from '@astrojs/cli-kit';
import { title, info, spinner } from '../messages.js';
import { execa } from 'execa';

export async function git(ctx: Pick<Context, 'cwd'|'git'|'yes'|'prompt'|'dryRun'>) {
	if (fs.existsSync(path.join(ctx.cwd, '.git'))) {
		await info('Nice!', `Git has already been initialized`);
		return
	}
	let _git = ctx.git ?? ctx.yes;
	if (_git === undefined) {
		({ git: _git } = await ctx.prompt({
			name: 'git',
			type: 'confirm',
			label: title('git'),
			message: `Initialize a new git repository?`,
			hint: 'optional',
			initial: true,
		}));
	}

	if (ctx.dryRun) {
		await info('--dry-run', `Skipping Git initialization`);
	} else if (_git) {
		await spinner({
			start: 'Git initializing...',
			end: 'Git initialized',
			while: () => init({ cwd: ctx.cwd }),
		});
	} else {
		await info(
			ctx.yes === false ? 'git [skip]' : 'Sounds good!',
			`You can always run ${color.reset('git init')}${color.dim(' manually.')}`
		);
	}
}

async function init({ cwd }: { cwd: string }) {
	return execa('git', ['init'], { cwd });
}

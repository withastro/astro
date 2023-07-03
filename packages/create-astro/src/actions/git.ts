import fs from 'node:fs';
import path from 'node:path';
import type { Context } from './context';

import { color } from '@astrojs/cli-kit';
import { execa } from 'execa';
import { error, info, spinner, title } from '../messages.js';

export async function git(ctx: Pick<Context, 'cwd' | 'git' | 'yes' | 'prompt' | 'dryRun'>) {
	if (fs.existsSync(path.join(ctx.cwd, '.git'))) {
		await info('Nice!', `Git has already been initialized`);
		return;
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
			while: () =>
				init({ cwd: ctx.cwd }).catch((e) => {
					error('error', e);
					process.exit(1);
				}),
		});
	} else {
		await info(
			ctx.yes === false ? 'git [skip]' : 'Sounds good!',
			`You can always run ${color.reset('git init')}${color.dim(' manually.')}`
		);
	}
}

async function init({ cwd }: { cwd: string }) {
	try {
		await execa('git', ['init'], { cwd, stdio: 'ignore' });
		await execa('git', ['add', '-A'], { cwd, stdio: 'ignore' });
		await execa(
			'git',
			[
				'commit',
				'-m',
				'Initial commit from Astro',
				'--author="houston[bot] <astrobot-houston@users.noreply.github.com>"',
			],
			{ cwd, stdio: 'ignore' }
		);
	} catch (e) {}
}

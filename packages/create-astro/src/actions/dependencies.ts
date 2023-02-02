import type { Context } from "./context";

import { spinner } from '@astrojs/cli-kit';
import { title, info } from '../messages.js';
import { execa } from 'execa';

export async function dependencies(ctx: Pick<Context, 'install'|'yes'|'prompt'|'pkgManager'|'cwd'|'dryRun'>) {
	let deps = ctx.install ?? ctx.yes;
	if (deps === undefined) {
		({ deps } = await ctx.prompt({
			name: 'deps',
			type: 'confirm',
			label: title('deps'),
			message: `Install dependencies?`,
			hint: '(recommended)',
			initial: true,
		}));
		ctx.install = deps;
	}

	if (ctx.dryRun) {
		await info('--dry-run', `Skipping dependency installation`);
	} else if (deps) {
		await spinner({
			start: `Dependencies installing with ${ctx.pkgManager}...`,
			end: 'Dependencies installed',
			while: () => install({ pkgManager: ctx.pkgManager, cwd: ctx.cwd }),
		});
	} else {
		await info(
			ctx.yes === false ? 'deps [skip]' : 'No problem!',
			'Remember to install dependencies after setup.'
		);
	}
}

async function install({ pkgManager, cwd }: { pkgManager: string, cwd: string }) {
		const installExec = execa(pkgManager, ['install'], { cwd });
		return new Promise<void>((resolve, reject) => {
			installExec.on('error', (error) => reject(error));
			installExec.on('close', () => resolve());
		});
}


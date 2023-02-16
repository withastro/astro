import type { Context } from './context';

import { execa } from 'execa';
import { error, info, spinner, title } from '../messages.js';

export async function dependencies(
	ctx: Pick<Context, 'install' | 'yes' | 'prompt' | 'pkgManager' | 'cwd' | 'dryRun'>
) {
	let deps = ctx.install ?? ctx.yes;
	if (deps === undefined) {
		({ deps } = await ctx.prompt({
			name: 'deps',
			type: 'confirm',
			label: title('deps'),
			message: `Install dependencies?`,
			hint: 'recommended',
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
			while: () =>
				install({ pkgManager: ctx.pkgManager, cwd: ctx.cwd }).catch((e) => {
					// eslint-disable-next-line no-console
					error('error', e);
					process.exit(1);
				}),
		});
	} else {
		await info(
			ctx.yes === false ? 'deps [skip]' : 'No problem!',
			'Remember to install dependencies after setup.'
		);
	}
}

async function install({ pkgManager, cwd }: { pkgManager: string; cwd: string }) {
	const installExec = execa(pkgManager, ['install'], { cwd });
	return new Promise<void>((resolve, reject) => {
		setTimeout(() => reject(`Request timed out after one minute`), 60_000);
		installExec.on('error', (e) => reject(e));
		installExec.on('close', () => resolve());
	});
}

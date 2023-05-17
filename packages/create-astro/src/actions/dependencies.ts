import { color } from '@astrojs/cli-kit';
import { execa } from 'execa';
import { error, info, spinner, title } from '../messages.js';
import type { Context } from './context';

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
			while: () => {
				return install({ pkgManager: ctx.pkgManager, cwd: ctx.cwd }).catch((e) => {
					error('error', e);
					error(
						'error',
						`Dependencies failed to install, please run ${color.bold(
							ctx.pkgManager + ' install'
						)}  to install them manually after setup.`
					);
				});
			},
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

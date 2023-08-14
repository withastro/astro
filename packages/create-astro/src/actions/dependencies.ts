import { color } from '@astrojs/cli-kit';
import { shell } from '../shell.js';
import fs from 'node:fs';
import path from 'node:path';
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
			start: `Installing dependencies with ${ctx.pkgManager}...`,
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
	if (pkgManager === 'yarn') await ensureYarnLock({ cwd });
	return shell(pkgManager, ['install'], { cwd, timeout: 90_000, stdio: 'ignore' });
}

async function ensureYarnLock({ cwd }: { cwd: string }) {
	const yarnLock = path.join(cwd, 'yarn.lock');
	if (fs.existsSync(yarnLock)) return;
	return fs.promises.writeFile(yarnLock, '', { encoding: 'utf-8' });
}

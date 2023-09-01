import type { Context } from './context.js';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { color } from '@astrojs/cli-kit';
import { error, info, spinner } from '../messages.js';
import { shell } from '../shell.js';

export async function install(
	ctx: Pick<Context, 'version' | 'packages' | 'packageManager' | 'dryRun' | 'cwd'>
) {
	if (ctx.dryRun) {
		await info('--dry-run', `Skipping dependency installation`);
	} else {
		await spinner({
			start: `Updating dependencies with ${ctx.packageManager}...`,
			end: 'Dependencies updated',
			while: () => {
				return runCommand(ctx).catch((e) => {
					error('error', e);
					error(
						'error',
						`Dependencies failed to install, please run ${color.bold(
							ctx.packageManager + ' install'
						)}  to install them manually after setup.`
					);
				});
			},
		});
	}
}

async function runCommand(ctx: Pick<Context, 'packageManager' | 'packages' | 'cwd'>) {
	const cwd = fileURLToPath(ctx.cwd);
	if (ctx.packageManager === 'yarn') await ensureYarnLock({ cwd });

	const dependencies: string[] = [];
	const devDependencies: string[] = [];
	for (const { name, targetVersion, isDevDependency } of ctx.packages) {
		const arr = isDevDependency ? devDependencies : dependencies;
		arr.push(`${name}@${targetVersion}`);
	}

	if (dependencies.length > 0) {
		await shell(ctx.packageManager, ['install', ...dependencies], { cwd, timeout: 90_000, stdio: 'ignore' });
	}
	if (devDependencies.length > 0) {
		await shell(ctx.packageManager, ['install', '--save-dev', ...devDependencies], { cwd, timeout: 90_000, stdio: 'ignore' });
	}
}

async function ensureYarnLock({ cwd }: { cwd: string }) {
	const yarnLock = path.join(cwd, 'yarn.lock');
	if (fs.existsSync(yarnLock)) return;
	return fs.promises.writeFile(yarnLock, '', { encoding: 'utf-8' });
}

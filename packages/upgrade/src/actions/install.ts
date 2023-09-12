import type { Context, PackageInfo } from './context.js';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { color } from '@astrojs/cli-kit';
import { celebrations, done, error, info, log, spinner, success, upgrade, banner } from '../messages.js';
import { shell } from '../shell.js';
import { random, sleep } from '@astrojs/cli-kit/utils';

export async function install(
	ctx: Pick<Context, 'version' | 'packages' | 'packageManager' | 'dryRun' | 'cwd'>
) {
	await banner();
	log('')
	const { current, dependencies, devDependencies } = filterPackages(ctx);
	const toInstall = [...dependencies, ...devDependencies];
	for (const packageInfo of current) {
		const tag = /^\d/.test(packageInfo.targetVersion) ? packageInfo.targetVersion : packageInfo.targetVersion.slice(1)
		await info(`${packageInfo.name}`, `is up to date on`, `v${tag}`)
		await sleep(random(0, 100));
	}
	if (toInstall.length === 0 && !ctx.dryRun) {
		log('')
		await success(random(celebrations), random(done))
		return;
	}
	for (const packageInfo of [...dependencies, ...devDependencies]) {
		const tag = /^\d/.test(packageInfo.targetVersion) ? packageInfo.targetVersion : packageInfo.targetVersion.slice(1)
		const word = ctx.dryRun ? 'can' : 'will'
		await upgrade(`${packageInfo.name}`, `${word} be updated to`,  `v${tag}`)
	}

	log('')
	if (ctx.dryRun) {
		await info('--dry-run', `Skipping dependency installation`);
	} else {
		await runInstallCommand(ctx, dependencies, devDependencies);
	}
}

function filterPackages(ctx: Pick<Context, 'packages'>) {
	const current: PackageInfo[] = [];
	const dependencies: PackageInfo[] = [];
	const devDependencies: PackageInfo[] = [];
	for (const packageInfo of ctx.packages) {
		const { currentVersion, targetVersion, isDevDependency } = packageInfo;
		if (currentVersion === targetVersion) {
			current.push(packageInfo);
		} else {
			const arr = isDevDependency ? devDependencies : dependencies;
			arr.push(packageInfo);
		}
	}
	return { current, dependencies, devDependencies }
}

async function runInstallCommand(ctx: Pick<Context, 'cwd' | 'packageManager'>, dependencies: PackageInfo[], devDependencies: PackageInfo[]) {
	const cwd = fileURLToPath(ctx.cwd);
	if (ctx.packageManager === 'yarn') await ensureYarnLock({ cwd });

	await spinner({
		start: `Installing dependencies with ${ctx.packageManager}...`,
		end: random(done),
		while: async () => {
			try {
				if (dependencies.length > 0) {
					await shell(ctx.packageManager, ['install', ...dependencies.map(({ name, targetVersion }) => `${name}@${targetVersion}`)], { cwd, timeout: 90_000, stdio: 'ignore' })
				}
				if (devDependencies.length > 0) {
					await shell(ctx.packageManager, ['install', '--save-dev', ...devDependencies.map(({ name, targetVersion }) => `${name}@${targetVersion}`)], { cwd, timeout: 90_000, stdio: 'ignore' })
				}
			} catch (e) {
				const packages = [...dependencies, ...devDependencies].map(({ name, targetVersion }) => `${name}@${targetVersion}`).join(' ')
				error(
					'error',
					`Dependencies failed to install, please run the following command manually:\n${color.bold(`${ctx.packageManager} install ${packages}`)}`
				);
				throw e;
			}
		},
	});
}

async function ensureYarnLock({ cwd }: { cwd: string }) {
	const yarnLock = path.join(cwd, 'yarn.lock');
	if (fs.existsSync(yarnLock)) return;
	return fs.promises.writeFile(yarnLock, '', { encoding: 'utf-8' });
}

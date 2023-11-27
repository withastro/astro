import type { Context, PackageInfo } from './context.js';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { color, say } from '@astrojs/cli-kit';
import { pluralize, celebrations, done, error, info, log, spinner, success, upgrade, banner, title, changelog, warn, bye } from '../messages.js';
import { shell } from '../shell.js';
import { random, sleep } from '@astrojs/cli-kit/utils';

export async function install(
	ctx: Pick<Context, 'version' | 'packages' | 'packageManager' | 'prompt' | 'dryRun' | 'exit' | 'cwd'>
) {
	await banner();
	log('')
	const { current, dependencies, devDependencies } = filterPackages(ctx);
	const toInstall = [...dependencies, ...devDependencies];
	for (const packageInfo of current.sort(sortPackages)) {
		const tag = /^\d/.test(packageInfo.targetVersion) ? packageInfo.targetVersion : packageInfo.targetVersion.slice(1)
		await info(`${packageInfo.name}`, `is up to date on`, `v${tag}`)
		await sleep(random(50, 150));
	}
	if (toInstall.length === 0 && !ctx.dryRun) {
		log('')
		await success(random(celebrations), random(done));
		return;
	}
	const majors: PackageInfo[] = []
	for (const packageInfo of [...dependencies, ...devDependencies].sort(sortPackages)) {
		const word = ctx.dryRun ? 'can' : 'will';
		await upgrade(packageInfo, `${word} be updated to`)
		if (packageInfo.isMajor) {
			majors.push(packageInfo)
		}
	}
	if (majors.length > 0) {
		const { proceed } = await ctx.prompt({
			name: 'proceed',
			type: 'confirm',
			label: title('WAIT'),
			message: `${pluralize(['One package has', 'Some packages have'], majors.length)} breaking changes. Continue?`,
			initial: true,
		});
		if (!proceed) {
			return ctx.exit(0);
		}
		
		log('');
		
		await warn('CHECK', `Be sure to follow the ${pluralize('CHANGELOG', majors.length)}.`);
		for (const pkg of majors.sort(sortPackages)) {
			await changelog(pkg.name, pkg.changelogTitle!, pkg.changelogURL!);
		}
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

function sortPackages(a: PackageInfo, b: PackageInfo): number {
	if (a.isMajor && !b.isMajor) return 1;
	if (b.isMajor && !a.isMajor) return -1;
	if (a.name === 'astro') return -1;
	if (b.name === 'astro') return 1;
	if (a.name.startsWith('@astrojs') && !b.name.startsWith('@astrojs')) return -1;
	if (b.name.startsWith('@astrojs') && !a.name.startsWith('@astrojs')) return 1;
	return a.name.localeCompare(b.name);
}

async function runInstallCommand(ctx: Pick<Context, 'cwd' | 'packageManager' | 'exit'>, dependencies: PackageInfo[], devDependencies: PackageInfo[]) {
	const cwd = fileURLToPath(ctx.cwd);
	if (ctx.packageManager === 'yarn') await ensureYarnLock({ cwd });

	await spinner({
		start: `Installing dependencies with ${ctx.packageManager}...`,
		end: `Installed dependencies!`,
		while: async () => {
			try {
				if (dependencies.length > 0) {
					await shell(ctx.packageManager, ['install', ...dependencies.map(({ name, targetVersion }) => `${name}@${(targetVersion).replace(/^\^/, '')}`)], { cwd, timeout: 90_000, stdio: 'ignore' })
				}
				if (devDependencies.length > 0) {
					await shell(ctx.packageManager, ['install', '--save-dev', ...devDependencies.map(({ name, targetVersion }) => `${name}@${(targetVersion).replace(/^\^/, '')}`)], { cwd, timeout: 90_000, stdio: 'ignore' })
				}
			} catch {
				const packages = [...dependencies, ...devDependencies].map(({ name, targetVersion }) => `${name}@${targetVersion}`).join(' ')
				log('');
				error(
					'error',
					`Dependencies failed to install, please run the following command manually:\n${color.bold(`${ctx.packageManager} install ${packages}`)}`
				);
				return ctx.exit(1);
			}
		},
	});

	await say([`${random(celebrations)} ${random(done)}`, random(bye)], { clear: false });
}

async function ensureYarnLock({ cwd }: { cwd: string }) {
	const yarnLock = path.join(cwd, 'yarn.lock');
	if (fs.existsSync(yarnLock)) return;
	return fs.promises.writeFile(yarnLock, '', { encoding: 'utf-8' });
}

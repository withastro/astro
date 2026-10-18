import dns from 'node:dns/promises';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { color } from '@astrojs/cli-kit';
import { coerce, difference, isGreaterThan, tryParse } from 'verkit';
import { bannerAbort, error, getRegistry, info, newline } from '../messages.js';
import { shell } from '../shell.js';
import type { Context, PackageInfo } from './context.js';

export async function verify(
	ctx: Pick<Context, 'version' | 'packages' | 'cwd' | 'dryRun' | 'exit'> &
		Partial<Pick<Context, 'packageManager'>>,
) {
	const registry = await getRegistry();

	if (!ctx.dryRun) {
		const online = await isOnline(registry);
		if (!online) {
			bannerAbort();
			newline();
			error('error', `Unable to connect to the internet.`);
			ctx.exit(1);
		}
	}

	const isAstroProject = await verifyAstroProject(ctx);
	if (!isAstroProject) {
		bannerAbort();
		newline();
		error('error', `Astro installation not found in the current directory.`);
		ctx.exit(1);
	}

	const minReleaseAge = await getMinReleaseAge(ctx.packageManager?.name);
	const ok = await verifyVersions(ctx, registry, minReleaseAge);
	if (!ok) {
		bannerAbort();
		newline();
		error('error', `Version ${color.reset(ctx.version)} ${color.dim('could not be found!')}`);
		await info('check', 'https://github.com/withastro/astro/releases');
		ctx.exit(1);
	}
}

function isOnline(registry: string): Promise<boolean> {
	const { hostname } = new URL(registry);
	return dns.lookup(hostname).then(
		() => true,
		() => false,
	);
}

function safeJSONParse(value: string) {
	try {
		return JSON.parse(value);
	} catch {}
	return {};
}

async function verifyAstroProject(ctx: Pick<Context, 'cwd' | 'version' | 'packages'>) {
	const packageJson = new URL('./package.json', ctx.cwd);
	if (!existsSync(packageJson)) return false;
	const contents = await readFile(packageJson, { encoding: 'utf-8' });
	if (!contents.includes('astro')) return false;

	const { dependencies = {}, devDependencies = {} } = safeJSONParse(contents);
	if (dependencies['astro'] === undefined && devDependencies['astro'] === undefined) return false;

	// Side-effect! Persist dependency info to the shared context
	collectPackageInfo(ctx, dependencies, devDependencies);

	return true;
}

function isAstroPackage(name: string, _version: string) {
	return name === 'astro' || name.startsWith('@astrojs/');
}

function isAllowedPackage(name: string, _version: string) {
	return name !== '@astrojs/upgrade';
}

function isValidVersion(_name: string, version: string) {
	return coerce(version, { loose: true }) !== null;
}

function isSupportedPackage(name: string, version: string): boolean {
	for (const validator of [isAstroPackage, isAllowedPackage, isValidVersion]) {
		if (!validator(name, version)) return false;
	}
	return true;
}

export function collectPackageInfo(
	ctx: Pick<Context, 'version' | 'packages'>,
	dependencies: Record<string, string> = {},
	devDependencies: Record<string, string> = {},
) {
	for (const [name, currentVersion] of Object.entries(dependencies)) {
		if (!isSupportedPackage(name, currentVersion)) continue;
		ctx.packages.push({
			name,
			currentVersion,
			targetVersion: ctx.version,
		});
	}
	for (const [name, currentVersion] of Object.entries(devDependencies)) {
		if (!isSupportedPackage(name, currentVersion)) continue;
		ctx.packages.push({
			name,
			currentVersion,
			targetVersion: ctx.version,
			isDevDependency: true,
		});
	}
}

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

/**
 * Reads the package manager's release age policy (npm `min-release-age`, pnpm `minimum-release-age`)
 * and returns it in milliseconds, or `undefined` if no policy is set.
 */
export async function getMinReleaseAge(
	packageManager = 'npm',
	shellFn: typeof shell = shell,
): Promise<number | undefined> {
	const configs: Record<string, { key: string; unit: number }> = {
		npm: { key: 'min-release-age', unit: MS_PER_DAY },
		pnpm: { key: 'minimum-release-age', unit: MS_PER_MINUTE },
	};
	const config = configs[packageManager];
	if (!config) return undefined;
	try {
		const { stdout } = await shellFn(packageManager, ['config', 'get', config.key]);
		const value = Number(stdout.trim());
		return Number.isFinite(value) && value > 0 ? value * config.unit : undefined;
	} catch {
		return undefined;
	}
}

async function verifyVersions(
	ctx: Pick<Context, 'version' | 'packages' | 'exit'>,
	registry: string,
	minReleaseAge?: number,
) {
	const tasks: Promise<void>[] = [];
	for (const packageInfo of ctx.packages) {
		tasks.push(resolveTargetVersion(packageInfo, registry, minReleaseAge));
	}
	try {
		await Promise.all(tasks);
	} catch {
		return false;
	}
	for (const packageInfo of ctx.packages) {
		if (!packageInfo.targetVersion) {
			return false;
		}
	}
	return true;
}

/**
 * Returns the newest version of a package published at least `minReleaseAge` ms ago,
 * no newer than `candidate`. Prereleases are only considered if `candidate` is one.
 * Returns `candidate` if it is old enough or if no older version qualifies.
 */
async function findReleaseOldEnough(
	name: string,
	registry: string,
	candidate: string,
	minReleaseAge: number,
): Promise<string> {
	// The abbreviated packument has no publish times, so the full one is needed.
	const res = await fetch(`${registry}/${name}`);
	if (res.status >= 400) return candidate;
	const { time = {} }: { time?: Record<string, string> } = await res.json();
	const cutoff = Date.now() - minReleaseAge;
	const isOldEnough = (version: string) => {
		const published = Date.parse(time[version]);
		return Number.isFinite(published) && published <= cutoff;
	};
	if (isOldEnough(candidate)) return candidate;
	const candidateParsed = tryParse(candidate);
	const allowPrerelease = (candidateParsed?.prerelease?.length ?? 0) > 0;
	let best: string | undefined;
	for (const version of Object.keys(time)) {
		const parsed = tryParse(version);
		if (!parsed || !isOldEnough(version)) continue;
		if (!allowPrerelease && (parsed.prerelease?.length ?? 0) > 0) continue;
		if (candidateParsed && isGreaterThan(parsed, candidateParsed)) continue;
		if (!best || isGreaterThan(parsed, tryParse(best)!)) best = version;
	}
	return best ?? candidate;
}

export async function resolveTargetVersion(
	packageInfo: PackageInfo,
	registry: string,
	minReleaseAge?: number,
): Promise<void> {
	const packageMetadata = await fetch(`${registry}/${packageInfo.name}`, {
		headers: { accept: 'application/vnd.npm.install-v1+json' },
	});
	if (packageMetadata.status >= 400) {
		throw new Error(`Unable to resolve "${packageInfo.name}"`);
	}
	const { 'dist-tags': distTags } = await packageMetadata.json();
	let version = distTags[packageInfo.targetVersion];
	if (version) {
		const currentCoerced = coerce(packageInfo.currentVersion);
		const targetParsed = tryParse(version);
		// If the dist-tag points to a version older than the installed one, fall back to latest.
		if (currentCoerced && targetParsed && isGreaterThan(currentCoerced, targetParsed)) {
			packageInfo.targetVersion = 'latest';
			version = distTags.latest;
		} else {
			packageInfo.tag = packageInfo.targetVersion;
			packageInfo.targetVersion = version;
		}
	} else {
		packageInfo.targetVersion = 'latest';
		version = distTags.latest;
	}
	if (minReleaseAge) {
		const eligible = await findReleaseOldEnough(packageInfo.name, registry, version, minReleaseAge);
		if (eligible !== version) {
			// The package manager would reject the newest version, so target the newest allowed one.
			version = eligible;
			packageInfo.tag = undefined;
			const currentCoerced = coerce(packageInfo.currentVersion);
			const eligibleParsed = tryParse(eligible);
			if (currentCoerced && eligibleParsed && !isGreaterThan(eligibleParsed, currentCoerced)) {
				// Nothing newer than what's installed is allowed yet.
				packageInfo.targetVersion = packageInfo.currentVersion;
				return;
			}
		}
	}
	if (packageInfo.currentVersion === version) {
		return;
	}
	const prefix = packageInfo.targetVersion === 'latest' ? '^' : '';
	packageInfo.targetVersion = `${prefix}${version}`;
	const fromVersion = coerce(packageInfo.currentVersion)!;
	const toVersion = tryParse(version)!;
	const bump = difference(fromVersion, toVersion);
	if ((bump === 'major' && (toVersion.prerelease?.length ?? 0) === 0) || bump === 'premajor') {
		packageInfo.isMajor = true;
		if (packageInfo.name === 'astro') {
			const upgradeGuide = `https://docs.astro.build/en/guides/upgrade-to/v${toVersion.major}/`;
			const docsRes = await fetch(upgradeGuide);
			// OK if this request fails, it's probably a prerelease without a public migration guide.
			// In that case, we should fall back to the CHANGELOG check below.
			if (docsRes.status === 200) {
				packageInfo.changelogURL = upgradeGuide;
				packageInfo.changelogTitle = `Upgrade to Astro v${toVersion.major}`;
				return;
			}
		}
		const latestMetadata = await fetch(`${registry}/${packageInfo.name}/latest`);
		if (latestMetadata.status >= 400) {
			throw new Error(`Unable to resolve "${packageInfo.name}"`);
		}
		const { repository } = await latestMetadata.json();
		const branch = bump === 'premajor' ? 'next' : 'main';
		packageInfo.changelogURL = extractChangelogURLFromRepository(repository, version, branch);
		packageInfo.changelogTitle = 'CHANGELOG';
	} else {
		// Dependency updates should not include the specific dist-tag
		// since they are just for compatibility
		packageInfo.tag = undefined;
	}
}

function extractChangelogURLFromRepository(
	repository: Record<string, string>,
	version: string,
	branch = 'main',
) {
	return (
		repository.url.replace('git+', '').replace('.git', '') +
		`/blob/${branch}/` +
		repository.directory +
		'/CHANGELOG.md#' +
		version.replace(/\./g, '')
	);
}

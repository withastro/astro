import * as assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import type { PackageInfo } from '../src/actions/context.ts';
import { collectPackageInfo, getMinReleaseAge, resolveTargetVersion } from '../dist/index.js';

describe('collectPackageInfo', () => {
	const context = {
		cwd: '',
		version: 'latest',
		packageManager: 'npm',
		dryRun: true,
		packages: [],
	};

	beforeEach(() => {
		context.packages = [];
	});

	it('detects astro', async () => {
		collectPackageInfo(context, { astro: '1.0.0' }, {});
		assert.deepEqual(context.packages, [
			{ name: 'astro', currentVersion: '1.0.0', targetVersion: 'latest' },
		]);
	});

	it('detects @astrojs', async () => {
		collectPackageInfo(context, { '@astrojs/preact': '1.0.0' }, {});
		assert.deepEqual(context.packages, [
			{ name: '@astrojs/preact', currentVersion: '1.0.0', targetVersion: 'latest' },
		]);
	});

	it('supports ^ prefixes', async () => {
		collectPackageInfo(context, { astro: '^1.0.0' }, {});
		assert.deepEqual(context.packages, [
			{ name: 'astro', currentVersion: '^1.0.0', targetVersion: 'latest' },
		]);
	});

	it('supports ~ prefixes', async () => {
		collectPackageInfo(context, { astro: '~1.0.0' }, {});
		assert.deepEqual(context.packages, [
			{ name: 'astro', currentVersion: '~1.0.0', targetVersion: 'latest' },
		]);
	});

	it('supports prereleases', async () => {
		collectPackageInfo(context, { astro: '1.0.0-beta.0' }, {});
		assert.deepEqual(context.packages, [
			{ name: 'astro', currentVersion: '1.0.0-beta.0', targetVersion: 'latest' },
		]);
	});

	it('ignores self', async () => {
		collectPackageInfo(context, { '@astrojs/upgrade': '0.0.1' }, {});
		assert.deepEqual(context.packages, []);
	});

	it('ignores linked packages', async () => {
		collectPackageInfo(context, { '@astrojs/preact': 'link:../packages/preact' }, {});
		assert.deepEqual(context.packages, []);
	});

	it('ignores workspace packages', async () => {
		collectPackageInfo(context, { '@astrojs/preact': 'workspace:*' }, {});
		assert.deepEqual(context.packages, []);
	});

	it('ignores github packages', async () => {
		collectPackageInfo(context, { '@astrojs/preact': 'github:withastro/astro' }, {});
		assert.deepEqual(context.packages, []);
	});

	it('ignores tag', async () => {
		collectPackageInfo(context, { '@astrojs/preact': 'beta' }, {});
		assert.deepEqual(context.packages, []);
	});
});

describe('resolveTargetVersion', () => {
	const originalFetch = globalThis.fetch;

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	function mockFetch(distTags: Record<string, string>) {
		globalThis.fetch = mock.fn(
			async () =>
				({
					status: 200,
					json: async () => ({ 'dist-tags': distTags }),
				}) as unknown as Response,
		);
	}

	it('does not downgrade when beta dist-tag is older than installed version', async () => {
		mockFetch({ latest: '3.7.3', beta: '3.6.1-beta.3' });
		const packageInfo: PackageInfo = {
			name: '@astrojs/sitemap',
			currentVersion: '^3.7.3',
			targetVersion: 'beta',
		};
		await resolveTargetVersion(packageInfo, 'https://registry.npmjs.org');
		// Should fall back to latest, not downgrade to 3.6.1-beta.3
		assert.ok(
			!packageInfo.targetVersion.includes('3.6.1-beta.3'),
			`Expected no downgrade, got targetVersion=${packageInfo.targetVersion}`,
		);
		assert.equal(packageInfo.tag, undefined);
	});

	it('uses beta dist-tag when it is newer than installed version', async () => {
		mockFetch({ latest: '6.4.5', beta: '7.0.0-beta.3' });
		const packageInfo: PackageInfo = {
			name: 'astro',
			currentVersion: '^6.4.5',
			targetVersion: 'beta',
		};
		await resolveTargetVersion(packageInfo, 'https://registry.npmjs.org');
		assert.equal(packageInfo.targetVersion, '7.0.0-beta.3');
		assert.equal(packageInfo.tag, 'beta');
	});

	it('falls back to latest when dist-tag does not exist', async () => {
		mockFetch({ latest: '3.7.3' });
		const packageInfo = {
			name: '@astrojs/sitemap',
			currentVersion: '^3.6.0',
			targetVersion: 'beta',
		};
		await resolveTargetVersion(packageInfo, 'https://registry.npmjs.org');
		assert.equal(packageInfo.targetVersion, '^3.7.3');
	});
});

describe('resolveTargetVersion with a minimum release age', () => {
	const originalFetch = globalThis.fetch;
	const DAY = 24 * 60 * 60 * 1000;
	const daysAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString();

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	function mockFetch(distTags: Record<string, string>, time: Record<string, string>) {
		globalThis.fetch = mock.fn(
			async () =>
				({
					status: 200,
					json: async () => ({ 'dist-tags': distTags, time }),
				}) as unknown as Response,
		);
	}

	it('keeps the latest version when it is old enough', async () => {
		mockFetch({ latest: '7.3.3' }, { '7.3.3': daysAgo(45) });
		const packageInfo: PackageInfo = {
			name: 'astro',
			currentVersion: '^7.0.0',
			targetVersion: 'latest',
		};
		await resolveTargetVersion(packageInfo, 'https://registry.npmjs.org', 30 * DAY);
		assert.equal(packageInfo.targetVersion, '7.3.3');
	});

	it('picks the newest version older than the minimum release age', async () => {
		mockFetch(
			{ latest: '7.4.0' },
			{
				'7.2.0': daysAgo(60),
				'7.3.3': daysAgo(31),
				'7.4.0': daysAgo(2),
				'8.0.0-beta.1': daysAgo(40),
			},
		);
		const packageInfo: PackageInfo = {
			name: 'astro',
			currentVersion: '^7.0.0',
			targetVersion: 'latest',
		};
		await resolveTargetVersion(packageInfo, 'https://registry.npmjs.org', 30 * DAY);
		assert.equal(packageInfo.targetVersion, '7.3.3');
	});

	it('does not move past a dist-tag when picking an older version', async () => {
		mockFetch(
			{ latest: '6.4.5', beta: '7.0.0-beta.3' },
			{
				'6.4.5': daysAgo(90),
				'7.0.0-beta.2': daysAgo(40),
				'7.0.0-beta.3': daysAgo(1),
				'7.0.0-beta.4': daysAgo(40),
			},
		);
		const packageInfo: PackageInfo = {
			name: 'astro',
			currentVersion: '^6.4.5',
			targetVersion: 'beta',
		};
		await resolveTargetVersion(packageInfo, 'https://registry.npmjs.org', 30 * DAY);
		assert.equal(packageInfo.targetVersion, '7.0.0-beta.2');
	});

	it('leaves the installed version alone when nothing newer is old enough', async () => {
		mockFetch({ latest: '7.4.0' }, { '7.0.0': daysAgo(90), '7.4.0': daysAgo(2) });
		const packageInfo: PackageInfo = {
			name: 'astro',
			currentVersion: '^7.0.0',
			targetVersion: 'latest',
		};
		await resolveTargetVersion(packageInfo, 'https://registry.npmjs.org', 30 * DAY);
		assert.equal(packageInfo.targetVersion, '^7.0.0');
	});

	it('ignores publish times when no minimum release age is set', async () => {
		mockFetch({ latest: '7.4.0' }, { '7.3.3': daysAgo(31), '7.4.0': daysAgo(2) });
		const packageInfo: PackageInfo = {
			name: 'astro',
			currentVersion: '^7.0.0',
			targetVersion: 'latest',
		};
		await resolveTargetVersion(packageInfo, 'https://registry.npmjs.org');
		assert.equal(packageInfo.targetVersion, '7.4.0');
	});
});

describe('getMinReleaseAge', () => {
	const shellFn = (stdout: string) => async () => ({ stdout, stderr: '', exitCode: 0 });

	it('reads npm min-release-age in days', async () => {
		assert.equal(await getMinReleaseAge('npm', shellFn('30')), 30 * 24 * 60 * 60 * 1000);
	});

	it('reads pnpm minimum-release-age in minutes', async () => {
		assert.equal(await getMinReleaseAge('pnpm', shellFn('1440')), 24 * 60 * 60 * 1000);
	});

	it('returns undefined when the setting is unset', async () => {
		assert.equal(await getMinReleaseAge('npm', shellFn('undefined')), undefined);
		assert.equal(await getMinReleaseAge('npm', shellFn('null')), undefined);
	});

	it('returns undefined when the config command fails', async () => {
		const failing = async () => {
			throw new Error('boom');
		};
		assert.equal(await getMinReleaseAge('npm', failing), undefined);
	});

	it('returns undefined for package managers without support', async () => {
		assert.equal(await getMinReleaseAge('yarn', shellFn('30')), undefined);
	});
});

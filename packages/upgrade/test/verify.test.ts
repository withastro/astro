import * as assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import type { PackageInfo } from '../src/actions/context.ts';
import { collectPackageInfo, resolveTargetVersion } from '../dist/index.js';

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

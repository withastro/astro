import * as assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { collectPackageInfo, verify } from '../dist/index.js';

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

describe('verify', () => {
	it('does not downgrade packages when a requested tag points to an older version', async () => {
		const cwd = await mkdtemp(join(tmpdir(), 'astro-upgrade-'));
		const originalFetch = globalThis.fetch;
		try {
			await writeFile(
				join(cwd, 'package.json'),
				JSON.stringify({
					dependencies: {
						astro: '7.0.0-beta.3',
						'@astrojs/react': '5.0.7',
					},
				}),
			);
			globalThis.fetch = async (input) => {
				const url = String(input);
				if (url.endsWith('/astro')) {
					return Response.json({ 'dist-tags': { latest: '6.4.5', beta: '7.0.0-beta.3' } });
				}
				if (url.endsWith('/@astrojs/react')) {
					return Response.json({ 'dist-tags': { latest: '5.0.7', beta: '5.0.0-beta.4' } });
				}
				return new Response(null, { status: 404 });
			};

			const context = {
				cwd: new URL(pathToFileURL(cwd) + '/'),
				version: 'beta',
				dryRun: true,
				packages: [],
				exit(code: number): never {
					throw new Error(`Unexpected exit ${code}`);
				},
			};

			await verify(context);

			assert.deepEqual(context.packages, [
				{
					name: 'astro',
					currentVersion: '7.0.0-beta.3',
					targetVersion: '7.0.0-beta.3',
					tag: 'beta',
				},
				{
					name: '@astrojs/react',
					currentVersion: '5.0.7',
					targetVersion: '5.0.7',
					tag: 'beta',
				},
			]);
		} finally {
			globalThis.fetch = originalFetch;
			await rm(cwd, { recursive: true, force: true });
		}
	});
});

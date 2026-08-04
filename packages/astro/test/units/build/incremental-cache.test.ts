import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { IncrementalBuildCache } from '../../../dist/core/build/incremental.js';

const ROUTE = 'src/pages/[slug].astro';
const HASH = 'deadbeef';

function previousManifest(
	paths: Record<
		string,
		{ cacheKey: string; outputFile: string; contentHashes?: Record<string, string> }
	>,
	{ dependencyHash = HASH, route = ROUTE } = {},
) {
	return {
		version: 1,
		configHash: 'cfg',
		lockfileHash: 'lock',
		routes: { [route]: { dependencyHash, paths } },
	};
}

describe('IncrementalBuildCache', () => {
	describe('canSkip', () => {
		const previous = previousManifest({ '/a': { cacheKey: 'k1', outputFile: 'a/index.html' } });

		it('does not skip when there is no previous build', () => {
			const cache = new IncrementalBuildCache('cfg', 'lock', new Map(), null);
			assert.equal(cache.canSkip(ROUTE, '/a', HASH, 'k1'), false);
		});

		it('does not skip when the route is absent from the previous build', () => {
			const cache = new IncrementalBuildCache('cfg', 'lock', new Map(), previous);
			assert.equal(cache.canSkip('src/pages/other.astro', '/a', HASH, 'k1'), false);
		});

		it('does not skip when the dependency hash changed', () => {
			const cache = new IncrementalBuildCache('cfg', 'lock', new Map(), previous);
			assert.equal(cache.canSkip(ROUTE, '/a', 'changed', 'k1'), false);
		});

		it('does not skip when the path is absent', () => {
			const cache = new IncrementalBuildCache('cfg', 'lock', new Map(), previous);
			assert.equal(cache.canSkip(ROUTE, '/missing', HASH, 'k1'), false);
		});

		it('does not skip when the cacheKey changed', () => {
			const cache = new IncrementalBuildCache('cfg', 'lock', new Map(), previous);
			assert.equal(cache.canSkip(ROUTE, '/a', HASH, 'k2'), false);
		});

		it('skips when the dependency hash and cacheKey match', () => {
			const cache = new IncrementalBuildCache('cfg', 'lock', new Map(), previous);
			assert.equal(cache.canSkip(ROUTE, '/a', HASH, 'k1'), true);
		});

		it('does not skip when a rendered content entry hash changed', () => {
			const previousWithContent = previousManifest({
				'/a': {
					cacheKey: 'k1',
					outputFile: 'a/index.html',
					contentHashes: { 'src/content/docs/a.mdx': 'h1' },
				},
			});
			const cache = new IncrementalBuildCache(
				'cfg',
				'lock',
				new Map([['src/content/docs/a.mdx', 'h2']]),
				previousWithContent,
			);
			assert.equal(cache.canSkip(ROUTE, '/a', HASH, 'k1'), false);
		});

		it('skips when rendered content entry hashes are unchanged', () => {
			const previousWithContent = previousManifest({
				'/a': {
					cacheKey: 'k1',
					outputFile: 'a/index.html',
					contentHashes: { 'src/content/docs/a.mdx': 'h1' },
				},
			});
			const cache = new IncrementalBuildCache(
				'cfg',
				'lock',
				new Map([['src/content/docs/a.mdx', 'h1']]),
				previousWithContent,
			);
			assert.equal(cache.canSkip(ROUTE, '/a', HASH, 'k1'), true);
		});
	});

	describe('findOrphanedFiles', () => {
		it('is empty when there is no previous build', () => {
			const cache = new IncrementalBuildCache('cfg', 'lock', new Map(), null);
			cache.record(ROUTE, HASH, '/a', 'k1', 'a/index.html');
			assert.deepEqual(cache.findOrphanedFiles(), []);
		});

		it('does not orphan a path re-recorded in this build', () => {
			const previous = previousManifest({ '/a': { cacheKey: 'k1', outputFile: 'a/index.html' } });
			const cache = new IncrementalBuildCache('cfg', 'lock', new Map(), previous);
			cache.record(ROUTE, HASH, '/a', 'k1', 'a/index.html');
			assert.deepEqual(cache.findOrphanedFiles(), []);
		});

		it('orphans a previous path that is no longer produced', () => {
			const previous = previousManifest({
				'/a': { cacheKey: 'k1', outputFile: 'a/index.html' },
				'/b': { cacheKey: 'k2', outputFile: 'b/index.html' },
			});
			const cache = new IncrementalBuildCache('cfg', 'lock', new Map(), previous);
			cache.record(ROUTE, HASH, '/a', 'k1', 'a/index.html');
			assert.deepEqual(cache.findOrphanedFiles(), ['b/index.html']);
		});
	});
});

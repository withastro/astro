import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

// The per-path collectors cannot attribute records correctly once renders
// interleave, so the incremental cache turns itself off when the build renders
// paths concurrently.
describe('experimental.incrementalBuild with build.concurrency > 1', () => {
	const root = new URL('./fixtures/incremental-build-concurrency/', import.meta.url);
	const cacheFile = new URL('node_modules/.astro/incremental-build.json', root);
	let fixture: Fixture;

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
		fixture = await loadFixture({
			root,
			output: 'static',
			build: {
				concurrency: 2,
			},
			experimental: {
				incrementalBuild: true,
			},
		});
		await fixture.build();
	});

	it('disables the cache instead of writing a manifest', async () => {
		assert.ok(!fs.existsSync(cacheFile), 'no incremental manifest should be written');
		// The build still produces its pages, just without incremental tracking.
		assert.ok(fixture.pathExists('/item/a/index.html'));
		assert.ok(fixture.pathExists('/item/b/index.html'));
	});
});

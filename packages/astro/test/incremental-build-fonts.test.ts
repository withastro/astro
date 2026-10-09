import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('incremental build + fonts API', () => {
	const root = new URL('./fixtures/incremental-build-fonts/', import.meta.url);
	const cacheFile = new URL('node_modules/.astro/incremental-build.json', root);
	let fixture: Fixture;

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(cacheFile, { force: true });
		fixture = await loadFixture({ root });
	});

	after(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(cacheFile, { force: true });
	});

	it('produces a stable dependencyHash across two builds when using the Fonts API', async () => {
		// First build — populates the cache
		await fixture.build();
		assert.ok(fs.existsSync(cacheFile), 'Cache manifest should exist after first build');
		const cache1 = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
		const route1 = cache1.routes['src/pages/[slug].astro'];
		assert.ok(route1, 'Route should be tracked in cache');
		const hash1 = route1.dependencyHash;
		assert.ok(hash1, 'Should have a dependency hash after first build');

		// Second build — no changes; dependencyHash should be identical
		await fixture.build();
		const cache2 = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
		const route2 = cache2.routes['src/pages/[slug].astro'];
		const hash2 = route2.dependencyHash;

		assert.equal(
			hash2,
			hash1,
			`dependencyHash should be stable across builds, but got:\n  build 1: ${hash1}\n  build 2: ${hash2}`,
		);
	});
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('experimental.incrementalBuild optimized images', () => {
	const root = new URL('./fixtures/incremental-build-images/', import.meta.url);
	const cacheFile = new URL('node_modules/.astro/incremental-build.json', root);
	let fixture: Fixture;
	let optimizedPath: string | undefined;

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
		fixture = await loadFixture({
			root,
			output: 'static',
			experimental: {
				incrementalBuild: true,
			},
		});

		// Warm the cache and capture the optimized image URL the page references.
		await fixture.build();
		const $ = cheerio.load(await fixture.readFile('/pic/a/index.html'));
		optimizedPath = $('img').attr('src');
	});

	it("emits a skipped page's optimized images on rebuild", async () => {
		const src = optimizedPath;
		assert.ok(src, 'expected the page to reference an image');
		assert.ok(src.startsWith('/_astro/'), `expected an optimized src, got ${src}`);
		assert.ok(fixture.pathExists(src), 'optimized image should exist after the warm build');

		// The transform is recorded against the path so it can be replayed on skip.
		const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
		const pathEntry = cache.routes['src/pages/pic/[slug].astro'].paths['/pic/a'];
		assert.ok(pathEntry.staticImages?.length > 0, 'the path should record its image transforms');

		// Astro empties dist/ each build; the optimized image is regenerated only
		// from the transform queue. Rebuild with no changes so the page is skipped
		// and restored from cache rather than re-rendered.
		await fixture.build();

		// The page never renders on the skip build, so without replaying its
		// transforms this optimized image would be missing and the restored HTML
		// would 404 on it.
		assert.ok(
			fixture.pathExists(src),
			'optimized image referenced by the skipped page should still be emitted',
		);
	});
});

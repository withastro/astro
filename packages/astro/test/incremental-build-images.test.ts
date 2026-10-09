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

	it('generates the images of skipped pages when the image cache is cold', async () => {
		fs.rmSync(new URL('node_modules/.astro/assets/', root), { recursive: true, force: true });
		await fixture.build();
		assert.ok(optimizedPath && fixture.pathExists(optimizedPath));
	});
});

describe('experimental.incrementalBuild images resolved in getStaticPaths', () => {
	const root = new URL('./fixtures/incremental-build-images/', import.meta.url);
	const cacheFile = new URL('node_modules/.astro/incremental-build.json', root);
	const cachedPage = new URL('node_modules/.astro/dist/gsp/a/index.html', root);
	let fixture: Fixture;
	let optimizedSrc: string | undefined;
	let originalSrc: string | undefined;

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

		await fixture.build();
		const $ = cheerio.load(await fixture.readFile('/gsp/a/index.html'));
		optimizedSrc = $('#optimized').attr('src');
		originalSrc = $('#original').attr('href');
	});

	it('emits the images on the first build', () => {
		assert.ok(
			optimizedSrc?.startsWith('/_astro/'),
			`expected an optimized src, got ${optimizedSrc}`,
		);
		assert.ok(originalSrc?.startsWith('/_astro/'), `expected an original src, got ${originalSrc}`);
		assert.notEqual(optimizedSrc, originalSrc);
		assert.ok(fixture.pathExists(optimizedSrc!), 'optimized image should be generated');
		assert.ok(fixture.pathExists(originalSrc!), 'original image should be kept');
	});

	it('does not record them against the path', () => {
		const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
		const pathEntry = cache.routes['src/pages/gsp/[slug].astro'].paths['/gsp/a'];
		assert.ok(!pathEntry.staticImages?.length, 'the render itself resolves no image');
		assert.ok(!pathEntry.referencedImages?.length, 'the render itself reads no image src');
	});

	describe('rebuild with no changes', () => {
		before(async () => {
			// A re-render would overwrite this sentinel.
			fs.writeFileSync(cachedPage, 'cached gsp sentinel');
			await fixture.build();
		});

		it('skips the path', async () => {
			assert.equal(await fixture.readFile('/gsp/a/index.html'), 'cached gsp sentinel');
		});

		it('still generates the optimized image resolved in getStaticPaths', () => {
			assert.ok(
				fixture.pathExists(optimizedSrc!),
				`${optimizedSrc} is referenced by the restored page and must still be generated`,
			);
		});

		it('still keeps the original image whose src getStaticPaths read', () => {
			assert.ok(
				fixture.pathExists(originalSrc!),
				`${originalSrc} is referenced by the restored page and must not be deleted`,
			);
		});
	});
});

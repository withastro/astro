import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('experimental.incrementalBuild', () => {
	const root = new URL('./fixtures/incremental-build/', import.meta.url);
	const cacheFile = new URL('node_modules/.astro/incremental-build.json', root);
	let fixture: Fixture;

	describe('first build', () => {
		before(async () => {
			fs.rmSync(new URL('dist/incremental-build/', root), { recursive: true, force: true });
			fs.rmSync(cacheFile, { force: true });
			fixture = await loadFixture({
				root,
				outDir: './dist/incremental-build/',
				experimental: {
					incrementalBuild: true,
				},
			});
			await fixture.build();
		});

		it('generates all pages on first build', async () => {
			const post1 = await fixture.readFile('/blog/post-1/index.html');
			const $ = cheerio.load(post1);
			assert.equal($('h1').text(), 'Post 1');

			const post2 = await fixture.readFile('/blog/post-2/index.html');
			const $2 = cheerio.load(post2);
			assert.equal($2('h1').text(), 'Post 2');

			const post3 = await fixture.readFile('/blog/post-3/index.html');
			const $3 = cheerio.load(post3);
			assert.equal($3('h1').text(), 'Post 3');

			const home = await fixture.readFile('/index.html');
			const $home = cheerio.load(home);
			assert.equal($home('h1').text(), 'Home');
		});

		it('creates a cache manifest in node_modules/.astro/', () => {
			assert.ok(fs.existsSync(cacheFile), 'Cache manifest should exist');

			const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
			assert.equal(cache.version, 1);

			// The blog route should be tracked
			const blogRoute = cache.routes['src/pages/blog/[slug].astro'];
			assert.ok(blogRoute, 'Blog route should be in cache');
			assert.ok(blogRoute.dependencyHash, 'Should have a dependency hash');
			assert.ok(blogRoute.paths['/blog/post-1'], 'post-1 should be tracked');
			assert.equal(blogRoute.paths['/blog/post-1'].cacheKey, 'v1');
			assert.equal(cache.routes['src/pages/index.astro'], undefined);
		});
	});

	describe('second build (no changes)', () => {
		let post1ContentBefore: string;

		before(async () => {
			// Read the output file before the second build
			post1ContentBefore = await fixture.readFile('/blog/post-1/index.html');

			// Rebuild — should skip pages with unchanged cacheKeys
			await fixture.build();
		});

		it('preserves cached pages', async () => {
			const post1 = await fixture.readFile('/blog/post-1/index.html');
			assert.equal(post1, post1ContentBefore, 'Cached page should be identical');
		});
	});

	describe('third build (missing output file)', () => {
		before(async () => {
			fs.rmSync(new URL('dist/incremental-build/blog/post-1/index.html', root), { force: true });
			await fixture.build();
		});

		it('re-renders cached pages when their output file is missing', async () => {
			const post1 = await fixture.readFile('/blog/post-1/index.html');
			const $ = cheerio.load(post1);
			assert.equal($('h1').text(), 'Post 1');
		});
	});

	describe('fourth build (changed content entry)', () => {
		const docA = new URL('./fixtures/incremental-build/src/content/docs/a.md', import.meta.url);
		let originalContent: string;

		before(async () => {
			originalContent = fs.readFileSync(docA, 'utf-8');
			fs.writeFileSync(
				new URL('dist/incremental-build/docs/b/index.html', root),
				'cached doc b sentinel',
			);
			fs.writeFileSync(docA, originalContent.replace('title: Doc A', 'title: Doc A Updated'));

			await fixture.build();
		});

		it('re-renders the content page with a changed cacheKey', async () => {
			const docA = await fixture.readFile('/docs/a/index.html');
			const $ = cheerio.load(docA);
			assert.equal($('h1').text(), 'Doc A Updated');
		});

		it('keeps unrelated content pages cached', async () => {
			const docB = await fixture.readFile('/docs/b/index.html');
			assert.equal(docB, 'cached doc b sentinel');
		});

		after(() => {
			fs.writeFileSync(docA, originalContent);
		});
	});

	describe('fifth build (changed dependency)', () => {
		const slugPage = new URL(
			'./fixtures/incremental-build/src/pages/blog/[slug].astro',
			import.meta.url,
		);
		const layoutPage = new URL(
			'./fixtures/incremental-build/src/layouts/Layout.astro',
			import.meta.url,
		);
		let originalContent: string;
		let originalLayout: string;

		before(async () => {
			originalContent = fs.readFileSync(slugPage, 'utf-8');
			originalLayout = fs.readFileSync(layoutPage, 'utf-8');

			// Write a modified version where post-2 has a new cacheKey.
			const modified = originalContent.replace(
				"{ params: { slug: 'post-2' }, props: { title: 'Post 2' }, cacheKey: 'v1' }",
				"{ params: { slug: 'post-2' }, props: { title: 'Post 2 Updated' }, cacheKey: 'v2' }",
			);
			fs.writeFileSync(slugPage, modified);

			// Also change a layout dependency. This should invalidate the whole route
			// even for paths whose cacheKey did not change.
			fs.writeFileSync(
				layoutPage,
				originalLayout.replace(
					'<body><slot /></body>',
					'<body><p id="layout-version">v2</p><slot /></body>',
				),
			);

			await fixture.build();
		});

		it('re-renders a page with a changed cacheKey', async () => {
			// post-2 should have the updated content
			const post2 = await fixture.readFile('/blog/post-2/index.html');
			const $ = cheerio.load(post2);
			assert.equal($('h1').text(), 'Post 2 Updated');
			assert.equal($('#layout-version').text(), 'v2');
		});

		it('re-renders unchanged cacheKey pages when a dependency changes', async () => {
			const post1 = await fixture.readFile('/blog/post-1/index.html');
			const $1 = cheerio.load(post1);
			assert.equal($1('h1').text(), 'Post 1');
			assert.equal($1('#layout-version').text(), 'v2');

			const post3 = await fixture.readFile('/blog/post-3/index.html');
			const $3 = cheerio.load(post3);
			assert.equal($3('h1').text(), 'Post 3');
			assert.equal($3('#layout-version').text(), 'v2');
		});

		it('updates the cache manifest with the new cacheKey', () => {
			const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
			const blogRoute = cache.routes['src/pages/blog/[slug].astro'];
			assert.equal(blogRoute.paths['/blog/post-2'].cacheKey, 'v2');
			// Other paths should still have v1
			assert.equal(blogRoute.paths['/blog/post-1'].cacheKey, 'v1');
		});

		// Restore original file after tests
		after(() => {
			fs.writeFileSync(slugPage, originalContent);
			fs.writeFileSync(layoutPage, originalLayout);
		});
	});

	describe('default build behavior', () => {
		const disabledCacheFile = new URL('node_modules/.astro-disabled/incremental-build.json', root);
		let disabledFixture: Fixture;

		before(async () => {
			fs.rmSync(new URL('dist/incremental-build-disabled/', root), {
				recursive: true,
				force: true,
			});
			fs.rmSync(new URL('node_modules/.astro-disabled/', root), {
				recursive: true,
				force: true,
			});

			disabledFixture = await loadFixture({
				root,
				outDir: './dist/incremental-build-disabled/',
				cacheDir: './node_modules/.astro-disabled/',
			});
			await disabledFixture.build();
			fs.writeFileSync(new URL('dist/incremental-build-disabled/stale.html', root), 'stale');
			await disabledFixture.build();
		});

		it('does not preserve stale files when the experimental flag is disabled', () => {
			assert.equal(
				fs.existsSync(new URL('dist/incremental-build-disabled/stale.html', root)),
				false,
			);
		});

		it('does not write an incremental cache manifest when the experimental flag is disabled', () => {
			assert.equal(fs.existsSync(disabledCacheFile), false);
		});
	});
});

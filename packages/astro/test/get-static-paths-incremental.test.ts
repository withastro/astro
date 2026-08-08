import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('getStaticPaths with experimental.incrementalBuild', () => {
	const root = new URL('./fixtures/get-static-paths-incremental/', import.meta.url);
	const page = new URL('src/pages/blog/[slug].astro', root);
	const cachedCopy = new URL('node_modules/.astro/dist/blog/astro-1/index.html', root);
	let fixture: Fixture;
	let original: string;
	let originalJson: string;

	const json = new URL('src/data/blog.json', root);

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
		original = fs.readFileSync(page, 'utf-8');
		originalJson = fs.readFileSync(json, 'utf-8');
		fixture = await loadFixture({
			root,
			output: 'static',
			experimental: {
				incrementalBuild: true,
			},
		});

		// Build 1: the page emits output and its copy is cached.
		await fixture.build();
	});

	after(() => {
		fs.writeFileSync(page, original);
		fs.writeFileSync(json, originalJson);
	});

	it('If a cacheKey field is present, then the cache is used.', async () => {
		assert.ok(fixture.pathExists('/blog/astro-1/index.html'), 'first build should emit the page');
		assert.ok(fs.existsSync(cachedCopy), 'first build should cache a copy');

		// Build 2: the page now renders same output (If the cacheKey is not changed,
		// rendering will proceed; otherwise, there will be no output).
		const cachedPage = fs.readFileSync(cachedCopy, 'utf-8');

		// change the title of the page to see if the cache is used
		const title = 'My First Blog Post';
		fs.writeFileSync(json, originalJson.replace(title, 'My New Blog Post'));
		await fixture.build();

		assert.ok(cachedPage.includes(title), 'The page still exists; use caching.');
	});

	it('If the cacheKey value changes, then a re-render will occur.', async () => {
		assert.ok(fixture.pathExists('/blog/astro-1/index.html'), 'first build should emit the page');
		assert.ok(fs.existsSync(cachedCopy), 'first build should cache a copy');

		// Build 2: the page now renders same output (If the cacheKey is not changed,
		// rendering will proceed; otherwise, there will be no output).
		// const cachedPage = fs.readFileSync(cachedCopy, 'utf-8');

		// change the blog.data(cacheKey) of the page to see if the cache is used
		const content = 'This is the content of my first blog post.';
		fs.writeFileSync(json, originalJson.replace(content, 'This is the content of my new blog post.'));
		await fixture.build();

		const newPage = fs.readFileSync(cachedCopy, 'utf-8');

		assert.ok(
			!newPage.includes(content),
			'The cacheKey value has changed; this page should be refreshed.',
		);
	});
});

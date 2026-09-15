import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('experimental.parallelPrerender', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static-build/',
			build: { concurrency: 2, inlineStylesheets: 'never' },
			experimental: { parallelPrerender: true },
			outDir: './dist/parallel-prerender/',
		});
		await fixture.build();
	});

	it('renders pages in worker threads', async () => {
		assert.match(await fixture.readFile('/index.html'), /<html/);
		assert.match(await fixture.readFile('/posts/thoughts/index.html'), /Testing here/);
		assert.equal((await fixture.readFile('/parallel/large.txt')).length, 300 * 1024);
		assert.equal(await fixture.readFile('/parallel/public.txt'), 'public\n');
	});

	it('preserves redirects and endpoint responses', async () => {
		assert.match(await fixture.readFile('/old/index.html'), /Redirecting/);
		assert.deepEqual(JSON.parse(await fixture.readFile('/company.json')), {
			name: 'Astro Technology Company',
			url: 'https://astro.build/',
		});
	});
});

describe('parallel prerender integrations', () => {
	it('renders framework components', async () => {
		const fixture = await loadFixture({
			root: './fixtures/static-build-frameworks/',
			build: { concurrency: 2 },
			experimental: { parallelPrerender: true },
			outDir: './dist/parallel-prerender-frameworks/',
		});
		await fixture.build();

		assert.match(await fixture.readFile('/react/index.html'), /<h1>Testing<\/h1>/);
		assert.match(await fixture.readFile('/preact/index.html'), /<h1>Testing<\/h1>/);
	});

	it('collects optimized images with incremental metadata', async () => {
		const fixture = await loadFixture({
			root: './fixtures/incremental-build-images/',
			build: { concurrency: 2 },
			cacheDir: './node_modules/.astro/parallel-prerender/',
			experimental: { incrementalBuild: true, parallelPrerender: true },
			outDir: './dist/parallel-prerender-images/',
		});
		await fixture.build({ force: true });

		const html = await fixture.readFile('/pic/a/index.html');
		const src = /<img[^>]+src="([^"]+)"/.exec(html)?.[1];
		assert.ok(src);
		assert.ok(src.startsWith('/_astro/'));
		assert.equal(fixture.pathExists(src), true);

		await fixture.build();
		assert.equal(await fixture.readFile('/pic/a/index.html'), html);
	});
});

describe('parallel prerender static paths', () => {
	it('transfers serializable props and renders every build', async () => {
		const root = new URL('./fixtures/static-build/', import.meta.url);
		const counterFile = new URL('gsp-count.txt', root);
		fs.rmSync(counterFile, { force: true });
		process.env.ASTRO_PARALLEL_PRERENDER_COUNTER = fileURLToPath(counterFile);
		const fixture = await loadFixture({
			root,
			build: { concurrency: 2 },
			experimental: { parallelPrerender: true },
			outDir: './dist/parallel-prerender-static-paths/',
		});

		try {
			await fixture.build();
			const firstRandom = await fixture.readFile('/parallel/random/index.html');
			assert.equal(fs.readFileSync(counterFile, 'utf8'), '1');
			assert.match(await fixture.readFile('/parallel/items/one/index.html'), />1<\/p>/);
			assert.match(
				await fixture.readFile('/parallel/functions/one/index.html'),
				/>function prop <\/p>/,
			);
			assert.match(
				await fixture.readFile('/parallel/functions/two/index.html'),
				/>URL prop https:\/\/astro\.build\/<\/p>/,
			);

			await fixture.build();
			assert.equal(fs.readFileSync(counterFile, 'utf8'), '2');
			assert.notEqual(await fixture.readFile('/parallel/random/index.html'), firstRandom);
		} finally {
			delete process.env.ASTRO_PARALLEL_PRERENDER_COUNTER;
			fs.rmSync(counterFile, { force: true });
		}
	});
});

describe('parallel prerender errors', () => {
	it('propagates render errors without hanging', async () => {
		const fixture = await loadFixture({
			root: './fixtures/build-concurrency/',
			build: { concurrency: 2 },
			experimental: { parallelPrerender: true },
			outDir: './dist/parallel-prerender-errors/',
		});

		await assert.rejects(fixture.build(), /This is a test/);
	});
});

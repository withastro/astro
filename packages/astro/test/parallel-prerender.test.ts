import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { testImageService } from './test-image-service.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('experimental.parallelPrerender', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/parallel-prerender/',
			// Enough capacity that the second worker never fills up, so scheduling is deterministic.
			build: { concurrency: 16 },
			experimental: { parallelPrerender: { workers: 2 } },
		});
		await fixture.build();
	});

	async function read(path: string) {
		const $ = cheerio.load(await fixture.readFile(path));
		return {
			discoveredIn: $('#discovered-in').text(),
			renderedIn: $('#rendered-in').text(),
			value: $('#value').text(),
			date: $('#date').text(),
		};
	}

	it('renders pages in worker threads', async () => {
		const { renderedIn } = await read('/index.html');
		assert.ok(Number(renderedIn) > 0, 'expected a worker thread id');
	});

	it('calls getStaticPaths once and renders its paths in another worker', async () => {
		const pages = await Promise.all(
			['one', 'two', 'three', 'four', 'five', 'six'].map((slug) =>
				read(`/items/${slug}/index.html`),
			),
		);
		const [{ discoveredIn }] = pages;
		for (const page of pages) {
			assert.equal(page.discoveredIn, discoveredIn);
			assert.notEqual(page.renderedIn, discoveredIn);
			assert.equal(page.date, new Date(0).toISOString());
		}
	});

	it('renders paths with props that cannot be cloned in the discovery worker', async () => {
		const { discoveredIn } = await read('/items/one/index.html');
		for (const value of ['function', 'url', 'symbol']) {
			const page = await read(`/local/${value}/index.html`);
			assert.equal(page.discoveredIn, discoveredIn);
			assert.equal(page.renderedIn, discoveredIn);
		}
		assert.equal((await read('/local/function/index.html')).value, 'function');
		assert.equal((await read('/local/url/index.html')).value, 'https://astro.build/');
		assert.equal((await read('/local/symbol/index.html')).value, 'symbol');
	});

	it('renders i18n fallback routes', async () => {
		assert.ok(fixture.pathExists('/fr/items/one/index.html'));
		assert.ok(fixture.pathExists('/fr/local/function/index.html'));
	});

	it('preserves redirects, endpoints and public files', async () => {
		assert.match(await fixture.readFile('/old/index.html'), /Redirecting/);
		assert.deepEqual(JSON.parse(await fixture.readFile('/company.json')), { name: 'Astro' });
		assert.equal(await fixture.readFile('/public.txt'), 'public\n');
	});
});

describe('parallel prerender with framework components', () => {
	it('renders framework components', async () => {
		const fixture = await loadFixture({
			root: './fixtures/static-build-frameworks/',
			experimental: { parallelPrerender: { workers: 2 } },
			outDir: './dist/parallel-prerender-frameworks/',
		});
		await fixture.build();

		assert.match(await fixture.readFile('/react/index.html'), /<h1>Testing<\/h1>/);
		assert.match(await fixture.readFile('/preact/index.html'), /<h1>Testing<\/h1>/);
	});
});

describe('parallel prerender with incremental builds', () => {
	it('collects optimized images with incremental metadata', async () => {
		const fixture = await loadFixture({
			root: './fixtures/incremental-build-images/',
			build: { concurrency: 2 },
			cacheDir: './node_modules/.astro/parallel-prerender/',
			experimental: { incrementalBuild: true, parallelPrerender: { workers: 2 } },
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

	it('preserves originals referenced by restored pages', async () => {
		const fixture = await loadFixture({
			root: './fixtures/incremental-build-referenced-images/',
			cacheDir: './node_modules/.astro/parallel-prerender/',
			experimental: { incrementalBuild: true, parallelPrerender: { workers: 2 } },
			outDir: './dist/parallel-prerender-referenced-images/',
		});
		await fixture.build({ force: true });

		const src = cheerio
			.load(await fixture.readFile('/cached/x/index.html'))('img')
			.attr('src');
		assert.ok(src);
		assert.equal(fixture.pathExists(src), true);
		const cache = JSON.parse(
			fs.readFileSync(new URL('incremental-build.json', fixture.config.cacheDir), 'utf-8'),
		);
		const pathEntry = cache.routes['src/pages/cached/[slug].astro'].paths['/cached/x'];
		assert.ok(pathEntry.referencedImages?.length > 0);

		await fixture.build();
		assert.equal(fixture.pathExists(src), true);
	});
});

describe('parallel prerender images', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/core-image-deletion/',
			image: { service: testImageService() },
			experimental: { parallelPrerender: { workers: 2 } },
			outDir: './dist/parallel-prerender-image-deletion/',
		});
		await fixture.build();
	});

	it('keeps only the originals referenced in workers', async () => {
		assert.equal((await fixture.glob('_astro/onlyone.*.*')).length, 1);
		assert.equal((await fixture.glob('_astro/twoofus.*.*')).length, 2);
		assert.equal((await fixture.glob('_astro/url.*.*')).length, 2);
	});

	it('generates images optimized in getStaticPaths in a worker', async () => {
		const $ = cheerio.load(await fixture.readFile('/paths/one/index.html'));
		const src = $('#from-paths').attr('src')!;
		assert.match(src, /^\/_astro\/staticPaths\.[^_/]+_[^_/]+\.webp$/);
		assert.ok(fixture.pathExists(src));
		assert.equal((await fixture.glob('_astro/staticPaths.*.*')).length, 1);
	});

	it('generates images optimized outside of a render in a worker', async () => {
		const $ = cheerio.load(await fixture.readFile('/outside-render/index.html'));
		const src = $('#outside-render').attr('src')!;
		assert.match(src, /^\/_astro\/outsideRender\.[^_/]+_[^_/]+\.webp$/);
		assert.ok(fixture.pathExists(src));
		assert.equal((await fixture.glob('_astro/outsideRender.*.*')).length, 1);
	});
});

describe('parallel prerender errors', () => {
	it('propagates render errors without hanging', async () => {
		const fixture = await loadFixture({
			root: './fixtures/build-concurrency/',
			build: { concurrency: 2 },
			experimental: { parallelPrerender: { workers: 2 } },
			outDir: './dist/parallel-prerender-errors/',
		});

		await assert.rejects(fixture.build(), /This is a test/);
	});

	it('fails the build when a worker exits', async () => {
		const fixture = await loadFixture({
			root: './fixtures/parallel-prerender-crash/',
			experimental: { parallelPrerender: { workers: 2 } },
		});

		await assert.rejects(fixture.build(), /worker exited unexpectedly with code 3/);
	});
});

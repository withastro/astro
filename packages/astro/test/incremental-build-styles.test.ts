import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.ts';

describe('experimental.incrementalBuild stylesheet dependencies', () => {
	const root = new URL('./fixtures/incremental-build-styles/', import.meta.url);
	const cacheFile = new URL('node_modules/.astro/incremental-build.json', root);
	const tokensFile = new URL('src/styles/_tokens.scss', root);
	const ROUTE = 'src/pages/[slug].astro';

	function routeHash(): string | undefined {
		const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
		return cache.routes[ROUTE]?.dependencyHash;
	}

	async function build() {
		const fixture = await loadFixture({
			root,
			experimental: { incrementalBuild: true },
		});
		await fixture.build();
		return fixture;
	}

	async function stylesheetHref(fixture: Awaited<ReturnType<typeof build>>) {
		const $ = cheerio.load(await fixture.readFile('/a/index.html'));
		return $('link[rel="stylesheet"]').attr('href');
	}

	let hashBefore: string | undefined;
	let hashAfter: string | undefined;
	let hrefBefore: string | undefined;
	let hrefAfter: string | undefined;
	let cssAfter: string | undefined;
	let existsAfter = false;

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
		fs.writeFileSync(tokensFile, '$brand: #ff0000;\n');

		let fixture = await build();
		hashBefore = routeHash();
		hrefBefore = await stylesheetHref(fixture);

		fs.writeFileSync(tokensFile, '$brand: #0000ff;\n');
		fixture = await build();
		hashAfter = routeHash();
		hrefAfter = await stylesheetHref(fixture);
		existsAfter = hrefAfter ? fixture.pathExists(hrefAfter) : false;
		cssAfter = existsAfter && hrefAfter ? await fixture.readFile(hrefAfter) : undefined;
	});

	after(() => {
		fs.writeFileSync(tokensFile, '$brand: #ff0000;\n');
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
	});

	it('records a dependency hash and an external stylesheet for the route', () => {
		assert.ok(hashBefore, 'route should be tracked in the cache');
		assert.ok(hrefBefore, 'page should link an external stylesheet');
	});

	it('changes the route dependency hash when a Sass partial changes', () => {
		assert.notEqual(hashBefore, hashAfter);
	});

	it('emits the stylesheet the rebuilt page links to', () => {
		assert.ok(existsAfter, `${hrefAfter} is linked by the page but was not emitted`);
		assert.notEqual(hrefBefore, hrefAfter, 'the stylesheet file name should have changed');
		assert.match(cssAfter ?? '', /#00f|#0000ff|blue/i);
	});
});

describe('experimental.incrementalBuild stylesheet hash stability', () => {
	const root = new URL('./fixtures/incremental-build-styles/', import.meta.url);
	const cacheFile = new URL('node_modules/.astro-stable/incremental-build.json', root);
	const ROUTE = 'src/pages/[slug].astro';

	function routeHash(): string | undefined {
		const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
		return cache.routes[ROUTE]?.dependencyHash;
	}

	let first: string | undefined;
	let second: string | undefined;
	let htmlFirst: string | undefined;
	let htmlSecond: string | undefined;

	before(async () => {
		fs.rmSync(new URL('dist/stable/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro-stable/', root), { recursive: true, force: true });

		for (let i = 0; i < 2; i++) {
			const fixture = await loadFixture({
				root,
				outDir: './dist/stable/',
				cacheDir: './node_modules/.astro-stable/',
				experimental: { incrementalBuild: true },
			});
			await fixture.build();
			const html = await fixture.readFile('/a/index.html');
			if (i === 0) {
				first = routeHash();
				htmlFirst = html;
			} else {
				second = routeHash();
				htmlSecond = html;
			}
		}
	});

	after(() => {
		fs.rmSync(new URL('dist/stable/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro-stable/', root), { recursive: true, force: true });
	});

	it('keeps the dependency hash and the output stable across two unchanged builds', () => {
		assert.ok(first, 'route should be tracked in the cache');
		assert.equal(second, first);
		assert.equal(htmlSecond, htmlFirst);
	});
});

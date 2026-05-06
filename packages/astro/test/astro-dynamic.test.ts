import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Dynamic components', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-dynamic/',
			outDir: './dist/astro-dynamic-dynamic-components/',
		});
		await fixture.build();
	});

	it('Loads packages that only run code in client', async () => {
		const html = await fixture.readFile('/index.html');

		const $ = cheerio.load(html);
		assert.equal($('script').length, 2, 'to have directive and astro island script');
	});

	it('Loads pages using client:media hydrator', async () => {
		const html = await fixture.readFile('/media/index.html');
		const $ = cheerio.load(html);

		// test 1: static value rendered
		assert.equal($('script').length, 2, 'to have directive and astro island script');
	});

	it('Loads pages using client:only hydrator', async () => {
		const html = await fixture.readFile('/client-only/index.html');
		const $ = cheerio.load(html);

		// test 1: <astro-island> is empty.
		assert.equal($('astro-island').html(), '');
		// test 2: component url
		const href = $('astro-island').attr('component-url')!;
		assert.equal(href.includes(`/PersistentCounter`), true);
	});
});

describe('Dynamic components subpath', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			site: 'https://site.com',
			base: '/blog',
			root: './fixtures/astro-dynamic/',
			outDir: './dist/astro-dynamic-dynamic-components-subpath/',
		});
		await fixture.build();
	});

	it('Loads packages that only run code in client', async () => {
		const html = await fixture.readFile('/index.html');

		const $ = cheerio.load(html);
		assert.equal($('script').length, 2);
	});

	it('Loads pages using client:media hydrator', async () => {
		const html = await fixture.readFile('/media/index.html');
		const $ = cheerio.load(html);

		// test 1: static value rendered
		assert.equal($('script').length, 2, 'to have directive and astro island script');
	});

	it('Loads pages using client:only hydrator', async () => {
		const html = await fixture.readFile('/client-only/index.html');
		const $ = cheerio.load(html);

		// test 1: <astro-island> is empty.
		assert.equal($('astro-island').html(), '');
		// test 2: has component url
		const attr = $('astro-island').attr('component-url')!;
		assert.equal(attr.includes(`blog/_astro/PersistentCounter`), true);
	});
});

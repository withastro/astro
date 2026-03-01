import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('imports using ?url suffix', () => {
	let fixture;
	const assetName = 'index.DqQksVyv.css';

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/url-import-suffix/' });
		await fixture.build();
	});

	it('includes the built asset in the output', async () => {
		const assets = await fixture.readdir('/_astro');
		assert.ok(assets.some((f) => f === assetName));
	});

	it('links the asset in the html', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		const linkHref = $('link[rel="stylesheet"]').attr('href');
		assert.ok(linkHref, `/_astro/${assetName}`);
	});
});

describe('imports using ?url&no-inline suffix', () => {
	let fixture;
	const assetName = 'style.3WhucSPm.css';

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/url-import-suffix/' });
		await fixture.build();
	});

	it('includes the built asset in the output', async () => {
		const assets = await fixture.readdir('/_astro');
		assert.ok(assets.some((f) => f === assetName));
	});

	it('links the asset in the html', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		const linkHref = $('link[rel="stylesheet"]').attr('href');
		assert.ok(linkHref, `/_astro/${assetName}`);
	});
});

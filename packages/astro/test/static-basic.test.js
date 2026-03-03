import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { getSharedFixture, getSharedPreviewServer, stopAllServers } from './shared-fixture.js';

describe('Static - Basic Astro Features', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await getSharedFixture({
			name: 'static',
			root: './fixtures/static/',
		});
		await fixture.build();
		await getSharedPreviewServer(fixture);
	});

	after(async () => {
		await stopAllServers();
	});

	it('Can load page', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		assert.equal($('h1').text(), 'Hello world!');
	});

	it('Correctly serializes boolean attributes', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		assert.equal($('h1').attr('data-something'), '');
		assert.equal($('h2').attr('not-data-ok'), '');
	});

	it('Selector with an empty body', async () => {
		const html = await fixture.readFile('/empty-class/index.html');
		const $ = cheerio.load(html);
		assert.equal($('.author').length, 1);
	});

	it('Allows forward-slashes in mustache tags', async () => {
		const html = await fixture.readFile('/forward-slash/index.html');
		const $ = cheerio.load(html);
		assert.equal($('a[href="/post/one"]').length, 1);
		assert.equal($('a[href="/post/two"]').length, 1);
		assert.equal($('a[href="/post/three"]').length, 1);
	});

	it('supports special chars in filename', async () => {
		assert.ok(await fixture.readFile('/special-"characters" -in-file/index.html'));
	});

	it('renders components top-down', async () => {
		const html = await fixture.readFile('/order/index.html');
		const $ = cheerio.load(html);
		assert.equal($('#rendered-order').text(), 'Rendered order: A, B');
	});

	it('renders markdown in utf-8 by default', async () => {
		const html = await fixture.readFile('/chinese-encoding-md/index.html');
		const $ = cheerio.load(html);
		assert.equal($('h1').text(), '我的第一篇博客文章');
		assert.match(html, /<meta charset="utf-8"/);
	});

	it('allows file:// urls as module specifiers', async () => {
		const html = await fixture.readFile('/fileurl/index.html');
		const $ = cheerio.load(html);
		assert.equal($('h1').text(), 'WORKS');
	});

	it('server sourcemaps not included in output', async () => {
		const files = await fixture.readdir('/');
		const hasSourcemaps = files.some((fileName) => fileName.endsWith('.map'));
		assert.equal(hasSourcemaps, false, 'no sourcemap files in output');
	});
});

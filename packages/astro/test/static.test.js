import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import {
	getSharedFixture,
	getSharedPreviewServer,
	getSharedDevServer,
	stopAllServers,
} from './shared-fixture.js';

/**
 * Consolidated test suite for static/SSG tests
 * This consolidates multiple smaller test files to reduce total test execution time
 */
describe('Static Tests', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await getSharedFixture({
			name: 'static',
			root: './fixtures/static/',
		});
		await getSharedPreviewServer(fixture);
	});

	after(async () => {
		// Shared fixtures handle their own cleanup
		await stopAllServers();
	});

	// Tests from astro-basic.test.js
	describe('Basic Astro Features', () => {
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

		it('Allows spread attributes', async () => {
			const html = await fixture.readFile('/spread/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#spread-leading').length, 1);
			assert.equal($('#spread-leading').attr('a'), '0');
			assert.equal($('#spread-leading').attr('b'), '1');
			assert.equal($('#spread-leading').attr('c'), '2');

			assert.equal($('#spread-trailing').length, 1);
			assert.equal($('#spread-trailing').attr('a'), '0');
			assert.equal($('#spread-trailing').attr('b'), '1');
			assert.equal($('#spread-trailing').attr('c'), '2');
		});

		it('Allows spread attributes with TypeScript', async () => {
			const html = await fixture.readFile('/spread/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#spread-ts').length, 1);
			assert.equal($('#spread-ts').attr('a'), '0');
			assert.equal($('#spread-ts').attr('b'), '1');
			assert.equal($('#spread-ts').attr('c'), '2');
		});

		it('Allows scoped classes with spread', async () => {
			const html = await fixture.readFile('/spread-scope/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#spread-plain').length, 1);
			assert.match($('#spread-plain').attr('class'), /astro-.*/);

			assert.equal($('#spread-class').length, 1);
			assert.match($('#spread-class').attr('class'), /astro-.*/);

			assert.equal($('#spread-class-list').length, 1);
			assert.match($('#spread-class-list').attr('class'), /astro-.*/);
		});

		it('Allows using the Fragment element', async () => {
			const html = await fixture.readFile('/fragment/index.html');
			const $ = cheerio.load(html);
			assert.equal($('#one').length, 1);
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

		it('Supports void elements whose name is a string', async () => {
			const html = await fixture.readFile('/input/index.html');
			const $ = cheerio.load(html);

			assert.equal($('body > :nth-child(1)').prop('outerHTML'), '<input>');
			assert.equal($('body > :nth-child(2)').prop('outerHTML'), '<input type="password">');
			assert.equal($('body > :nth-child(3)').prop('outerHTML'), '<input type="text">');
			assert.equal(
				$('body > :nth-child(4)').prop('outerHTML'),
				'<select><option>option</option></select>',
			);
			assert.equal($('body > :nth-child(5)').prop('outerHTML'), '<textarea>textarea</textarea>');
		});

		it('Generates pages that end with .mjs', async () => {
			const content1 = await fixture.readFile('/get-static-paths-with-mjs/example.mjs');
			assert.ok(content1);
			const content2 = await fixture.readFile('/get-static-paths-with-mjs/example.js');
			assert.ok(content2);
		});

		it('allows file:// urls as module specifiers', async () => {
			const html = await fixture.readFile('/fileurl/index.html');
			const $ = cheerio.load(html);
			assert.equal($('h1').text(), 'WORKS');
		});

		it('Handles importing .astro?raw correctly', async () => {
			const html = await fixture.readFile('/import-queries/raw/index.html');
			const $ = cheerio.load(html);
			const rawValue = $('.raw-value').text();
			assert.match(rawValue, /<h1>Hello<\/h1>/);
			assert.match(rawValue, /<script>/);
			assert.match(rawValue, /<style>/);
			const otherHtml = html.replace(rawValue, '');
			assert.doesNotMatch(otherHtml, /<script/);
			assert.doesNotMatch(otherHtml, /<style/);
		});

		it('server sourcemaps not included in output', async () => {
			const files = await fixture.readdir('/');
			const hasSourcemaps = files.some((fileName) => fileName.endsWith('.map'));
			assert.equal(hasSourcemaps, false, 'no sourcemap files in output');
		});
	});

	// Preview tests
	describe('Preview Server', () => {
		it('returns 200 for valid URLs', async () => {
			const result = await fixture.fetch('/');
			assert.equal(result.status, 200);
		});

		it('returns 404 for invalid URLs', async () => {
			const result = await fixture.fetch('/bad-url');
			assert.equal(result.status, 404);
		});
	});

	// Additional static tests can be added here as we consolidate more files
});

// Separate describe block for dev server tests (if needed for specific static features)
describe('Static Dev Tests', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await getSharedFixture({
			name: 'static',
			root: './fixtures/static/',
		});
		await getSharedDevServer(fixture);
	});

	after(async () => {
		// Shared servers handle their own cleanup
		await stopAllServers();
	});

	it('Renders markdown in utf-8 in dev', async () => {
		const res = await fixture.fetch('/chinese-encoding-md');
		assert.equal(res.status, 200);
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('h1').text(), '我的第一篇博客文章');
		assert.doesNotMatch(res.headers.get('content-type'), /charset=utf-8/);
		assert.match(html, /<meta charset="utf-8"/);
	});

	it('Handles importing .astro?raw correctly in dev', async () => {
		const res = await fixture.fetch('/import-queries/raw/index.html');
		assert.equal(res.status, 200);
		const html = await res.text();
		const $ = cheerio.load(html);
		const rawValue = $('.raw-value').text();
		assert.match(rawValue, /<h1>Hello<\/h1>/);
		assert.match(rawValue, /<script>/);
		assert.match(rawValue, /<style>/);
		assert.doesNotMatch(html, /_content.astro\?astro&type=style/);
		assert.doesNotMatch(html, /_content.astro\?astro&type=script/);
	});
});

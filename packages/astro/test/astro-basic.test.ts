import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import createTestPrerenderer from './test-prerenderer.ts';
import { type DevServer, type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

describe('Astro basic build', () => {
	let fixture: Fixture;

	let previewServer: PreviewServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-basic/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	// important: close preview server (free up port and connection)
	after(async () => {
		await previewServer.stop();
	});

	it('Allows scoped classes with spread', async () => {
		const html = await fixture.readFile('/spread-scope/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#spread-plain').length, 1);
		assert.match($('#spread-plain').attr('class')!, /astro-.*/);

		assert.equal($('#spread-class').length, 1);
		assert.match($('#spread-class').attr('class')!, /astro-.*/);

		assert.equal($('#spread-class-list').length, 1);
		assert.match($('#spread-class-list').attr('class')!, /astro-.*/);
	});

	it('supports special chars in filename', async () => {
		// will have already erred by now, but add test anyway
		assert.ok(await fixture.readFile('/special-“characters” -in-file/index.html'));
	});

	it('renders markdown in utf-8 by default', async () => {
		const html = await fixture.readFile('/chinese-encoding-md/index.html');
		const $ = cheerio.load(html);
		assert.equal($('h1').text(), '我的第一篇博客文章');
		assert.match(html, /<meta charset="utf-8"/);
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
		// The rest of HTML should not contain any scripts or styles hoisted from the raw import
		const otherHtml = html.replace(rawValue, '');
		assert.doesNotMatch(otherHtml, /<script/);
		assert.doesNotMatch(otherHtml, /<style/);
	});

	it('server sourcemaps not included in output', async () => {
		const files = await fixture.readdir('/');
		const hasSourcemaps = files.some((fileName) => {
			return fileName.endsWith('.map');
		});
		assert.equal(hasSourcemaps, false, 'no sourcemap files in output');
	});

	it('Defines Astro.generator', async () => {
		const html = await fixture.readFile('/generator/index.html');
		const $ = cheerio.load(html);
		assert.match($('meta[name="generator"]').attr('content')!, /^Astro v/);
	});

	describe('preview', () => {
		it('returns 200 for valid URLs', async () => {
			const result = await fixture.fetch('/');
			assert.equal(result.status, 200);
		});

		it('returns 404 for invalid URLs', async () => {
			const result = await fixture.fetch('/bad-url');
			assert.equal(result.status, 404);
		});
	});
});

describe('Astro basic development', () => {
	let devServer: DevServer;
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-basic/',
		});
		devServer = await fixture.startDevServer();
	});
	after(async () => {
		await devServer.stop();
	});

	it('Renders markdown in utf-8 by default', async () => {
		const res = await fixture.fetch('/chinese-encoding-md');
		assert.equal(res.status, 200);
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('h1').text(), '我的第一篇博客文章');
		assert.doesNotMatch(res.headers.get('content-type')!, /charset=utf-8/);
		assert.match(html, /<meta charset="utf-8"/);
	});

	it('Handles importing .astro?raw correctly', async () => {
		const res = await fixture.fetch('/import-queries/raw/index.html');
		assert.equal(res.status, 200);
		const html = await res.text();
		const $ = cheerio.load(html);
		const rawValue = $('.raw-value').text();
		assert.match(rawValue, /<h1>Hello<\/h1>/);
		assert.match(rawValue, /<script>/);
		assert.match(rawValue, /<style>/);
		// The rest of HTML should not contain any scripts or styles hoisted from the raw import.
		// However we don't check them here as dev plugins could add scripts and styles dynam
		assert.doesNotMatch(html, /_content.astro\?astro&type=style/);
		assert.doesNotMatch(html, /_content.astro\?astro&type=script/);
	});
});

describe('Astro custom prerenderer', () => {
	let fixture: Fixture;
	let testPrerenderer: ReturnType<typeof createTestPrerenderer>;

	before(async () => {
		testPrerenderer = createTestPrerenderer();
		fixture = await loadFixture({
			root: './fixtures/astro-basic/',
			integrations: [testPrerenderer.integration],
		});
		await fixture.build();
	});

	it('calls prerenderer lifecycle methods', () => {
		assert.equal(testPrerenderer.calls.setup, 1, 'setup should be called once');
		assert.equal(testPrerenderer.calls.getStaticPaths, 1, 'getStaticPaths should be called once');
		assert.ok(testPrerenderer.calls.render > 0, 'render should be called at least once');
		assert.equal(testPrerenderer.calls.teardown, 1, 'teardown should be called once');
	});

	it('renders pages through the custom prerenderer', () => {
		assert.ok(testPrerenderer.renderedPaths.includes('/'), 'should render index page');
		assert.ok(testPrerenderer.renderedPaths.length > 0, 'should render at least one page');
	});

	it('produces valid output', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		assert.equal($('h1').text(), 'Hello world!');
	});
});

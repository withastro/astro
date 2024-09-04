// @ts-check
import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

/**
 *
 * @param {import('../dist/types/public/config.js').AstroConfig["output"] | undefined} output
 * @returns
 */
const createFixture = (output = undefined) =>
	loadFixture({
		root: './fixtures/astro-global-prerender/',
		adapter: testAdapter(),
		output,
	});

describe('Astro Global isPrerendered', () => {
	/** @type {import('../dist/core/dev/dev.js').DevServer | undefined} */
	let devServer;

	after(async () => {
		if (devServer) {
			await devServer?.stop();
			devServer = undefined;
		}
	});

	it('dev', async () => {
		let fixture = await createFixture();
		devServer = await fixture.startDevServer({});

		let html = await fixture.fetch('/', {}).then((res) => res.text());
		let $ = cheerio.load(html);
		assert.match($('#prerender').text(), /Astro route prerender: true/);
		assert.match($('#prerender-middleware').text(), /Astro route prerender middleware: true/);

		html = await fixture.fetch('/about', {}).then((res) => res.text());
		$ = cheerio.load(html);
		assert.match($('#prerender').text(), /Astro route prerender: true/);
		assert.match($('#prerender-middleware').text(), /Astro route prerender middleware: true/);

		await devServer.stop();

		fixture = await createFixture('hybrid');
		devServer = await fixture.startDevServer({});

		html = await fixture.fetch('/', {}).then((res) => res.text());
		$ = cheerio.load(html);
		assert.match($('#prerender').text(), /Astro route prerender: true/);
		assert.match($('#prerender-middleware').text(), /Astro route prerender middleware: true/);

		html = await fixture.fetch('/about', {}).then((res) => res.text());
		$ = cheerio.load(html);
		assert.match($('#prerender').text(), /Astro route prerender: false/);
		assert.match($('#prerender-middleware').text(), /Astro route prerender middleware: false/);
	});

	describe('build', async () => {
		let fixture = await createFixture();
		await fixture.build({});

		let html = await fixture.readFile('/index.html');
		let $ = cheerio.load(html);
		assert.match($('#prerender').text(), /Astro route prerender: true/);
		assert.match($('#prerender-middleware').text(), /Astro route prerender middleware: true/);

		html = await fixture.readFile('/about/index.html');
		$ = cheerio.load(html);
		assert.match($('#prerender').text(), /Astro route prerender: true/);
		assert.match($('#prerender-middleware').text(), /Astro route prerender middleware: true/);
	});

	describe('app', async () => {
		const fixture = await createFixture('server');
		await fixture.build({});
		const app = await fixture.loadTestAdapterApp();

		let html = await fixture.readFile('/index.html');
		let $ = cheerio.load(html);
		assert.match($('#prerender').text(), /Astro route prerender: true/);
		assert.match($('#prerender-middleware').text(), /Astro route prerender middleware: true/);

		html = await app.render(new Request('https://example.com/about')).then((res) => res.text());
		$ = cheerio.load(html);
		assert.match($('#prerender').text(), /Astro route prerender: false/);
		assert.match($('#prerender-middleware').text(), /Astro route prerender middleware: false/);
	});
});

import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Astro HTTP/2 support', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-dev-http2/',
			outDir: './dist/astro-dev-http2/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	describe('dev', () => {
		it('returns custom headers for valid URLs', async () => {
			const result = await fixture.fetch('/');
			assert.equal(result.status, 200);
			const html = await result.text();
			const $ = cheerio.load(html);
			const urlString = $('main').text();
			assert.equal(Boolean(urlString), true);
			const url = new URL(urlString);
			// Not asserting host because of all the ways localhost can be represented
			assert.equal(url.protocol, 'https:');
			assert.equal($('p').text(), '2.0');
		});
	});
});

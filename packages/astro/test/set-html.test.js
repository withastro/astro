import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('set:html', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/set-html/',
		});
	});

	describe('Development', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
			globalThis.TEST_FETCH = (fetch, url, init) => {
				return fetch(fixture.resolveUrl(url), init);
			};
		});

		after(async () => {
			await devServer.stop();
		});

		it('can take a fetch()', async () => {
			let res = await fixture.fetch('/fetch');
			assert.equal(res.status, 200);
			let html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#fetched-html').length, 1);
			assert.equal($('#fetched-html').text(), 'works');
		});
		it('test Fragment when Fragment is as a slot', async () => {
			let res = await fixture.fetch('/children');
			assert.equal(res.status, 200);
			let html = await res.text();
			assert.equal(html.includes('Test'), true);
		});
	});

	describe('Build', () => {
		before(async () => {
			await fixture.build();
		});

		it('test Fragment when Fragment is as a slot', async () => {
			let res = await fixture.readFile('/children/index.html');
			assert.equal(res.includes('Test'), true);
		});
	});
});

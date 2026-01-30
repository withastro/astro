import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Aliases with tsconfig.json without baseUrl', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/alias-tsconfig-no-baseurl/',
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('can resolve paths without baseUrl', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);

			// Should render the content from @hello/world
			assert.equal($('h1').text(), 'world');
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('can resolve paths without baseUrl', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// Should render the content from @hello/world
			assert.equal($('h1').text(), 'world');
		});
	});
});

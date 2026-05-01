import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import testAdapter from 'astro/_internal/test/test-adapter';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('astro:db', () => {
	let fixture: Fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/db-in-src/', import.meta.url),
			output: 'server',
			srcDir: '.',
			adapter: testAdapter(),
		});
	});

	describe('development: db/ folder inside srcDir', () => {
		let devServer: DevServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Prints the list of authors', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerioLoad(html);

			const ul = $('.users-list');
			assert.equal(ul.children().length, 1);
			assert.match($('.users-list li').text(), /Mario/);
		});
	});
});

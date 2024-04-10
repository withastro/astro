import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import testAdapter from '../../astro/test/test-adapter.js';
import { loadFixture } from '../../astro/test/test-utils.js';

describe('astro:db', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/db-in-src/', import.meta.url),
			output: 'server',
			srcDir: '.',
			adapter: testAdapter(),
		});
	});

	describe('development: db/ folder inside srcDir', () => {
		let devServer;

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
			expect(ul.children()).to.have.a.lengthOf(1);
			expect($('.users-list li').text()).to.equal('Mario');
		});
	});
});

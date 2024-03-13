import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from '../../astro/test/test-utils.js';

describe('astro:db with only integrations, no user db config', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/integration-only/', import.meta.url),
		});
	});

	describe('development', () => {
		let devServer;
		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Prints the list of menu items from integration-defined table', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerioLoad(html);

			const ul = $('ul.menu');
			expect(ul.children()).to.have.a.lengthOf(4);
			expect(ul.children().eq(0).text()).to.equal('Pancakes');
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Prints the list of menu items from integration-defined table', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerioLoad(html);

			const ul = $('ul.menu');
			expect(ul.children()).to.have.a.lengthOf(4);
			expect(ul.children().eq(0).text()).to.equal('Pancakes');
		});
	});
});

import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from '../../astro/test/test-utils.js';

describe('astro:db with integrations', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/integrations/', import.meta.url),
		});
	});

	// Note(bholmesdev): Use in-memory db to avoid
	// Multiple dev servers trying to unlink and remount
	// the same database file.
	process.env.TEST_IN_MEMORY_DB = 'true';
	describe('development', () => {
		let devServer;

		before(async () => {
			console.log('starting dev server');
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
			process.env.TEST_IN_MEMORY_DB = undefined;
		});

		it('Prints the list of authors from user-defined table', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerioLoad(html);

			const ul = $('.authors-list');
			expect(ul.children()).to.have.a.lengthOf(5);
			expect(ul.children().eq(0).text()).to.equal('Ben');
		});

		it('Prints the list of menu items from integration-defined table', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerioLoad(html);

			const ul = $('ul.menu');
			expect(ul.children()).to.have.a.lengthOf(4);
			expect(ul.children().eq(0).text()).to.equal('Pancakes');
		});
	});
});

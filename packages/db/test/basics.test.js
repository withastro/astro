import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import testAdapter from '../../astro/test/test-adapter.js';
import { loadFixture } from '../../astro/test/test-utils.js';

describe('astro:db', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/basics/', import.meta.url),
			output: 'server',
			adapter: testAdapter(),
		});
	});

	process.env.TEST_IN_MEMORY_DB = 'true';
	describe('development', () => {
		let devServer;

		// Note(bholmesdev): Using before() caused a race condition
		// of parallel tests trying to seed at the same time.
		// This does not occur locally, but appears in the test runner
		// as the `astro:db` module is re-evaluated for each test.
		// Still unsure why this occurs!
		// Use beforeEach() to avoid clobbering.
		before(async () => {
			console.log('starting dev server');
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
			process.env.TEST_IN_MEMORY_DB = undefined;
		});

		it('Prints the list of authors', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerioLoad(html);

			const ul = $('.authors-list');
			expect(ul.children()).to.have.a.lengthOf(5);
			expect(ul.children().eq(0).text()).to.equal('Ben');
		});

		it('Allows expression defaults for date columns', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerioLoad(html);

			const themeAdded = $($('.themes-list .theme-added')[0]).text();
			expect(new Date(themeAdded).getTime()).to.not.be.NaN;
		});

		it('Defaults can be overridden for dates', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerioLoad(html);

			const themeAdded = $($('.themes-list .theme-added')[1]).text();
			expect(new Date(themeAdded).getTime()).to.not.be.NaN;
		});

		it('Allows expression defaults for text columns', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerioLoad(html);

			const themeOwner = $($('.themes-list .theme-owner')[0]).text();
			expect(themeOwner).to.equal('');
		});

		it('Allows expression defaults for boolean columns', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerioLoad(html);

			const themeDark = $($('.themes-list .theme-dark')[0]).text();
			expect(themeDark).to.equal('dark mode');
		});
	});
});

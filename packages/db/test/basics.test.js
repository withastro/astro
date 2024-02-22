import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import testAdapter from '../../astro/test/test-adapter.js';
import { loadFixture } from '../../astro/test/test-utils.js';

// TODO(fks): Rename this to something more generic/generally useful
// like `ASTRO_MONOREPO_TEST_ENV` if @astrojs/db is merged into astro.
process.env.ASTRO_DB_TEST_ENV = '1';

describe('astro:db', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/basics/', import.meta.url),
			output: 'server',
			adapter: testAdapter(),
		});
	});

	describe('production', () => {
		before(async () => {
			await fixture.build();
		});

		it('Prints the list of authors', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/');
			const res = await app.render(request);
			const html = await res.text();
			const $ = cheerioLoad(html);

			const ul = $('.authors-list');
			expect(ul.children()).to.have.a.lengthOf(5);
			expect(ul.children().eq(0).text()).to.equal('Ben');
		});

		it('Errors when inserting to a readonly collection', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/insert-into-readonly');
			const res = await app.render(request);
			const html = await res.text();
			const $ = cheerioLoad(html);

			expect($('#error').text()).to.equal('The [Author] collection is read-only.');
		});

		it('Does not error when inserting into writable collection', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/insert-into-writable');
			const res = await app.render(request);
			const html = await res.text();
			const $ = cheerioLoad(html);

			expect($('#error').text()).to.equal('');
		});

		describe('Expression defaults', () => {
			let app;
			before(async () => {
				app = await fixture.loadTestAdapterApp();
			});

			it('Allows expression defaults for date columns', async () => {
				const request = new Request('http://example.com/');
				const res = await app.render(request);
				const html = await res.text();
				const $ = cheerioLoad(html);

				const themeAdded = $($('.themes-list .theme-added')[0]).text();
				expect(new Date(themeAdded).getTime()).to.not.be.NaN;
			});

			it('Defaults can be overridden for dates', async () => {
				const request = new Request('http://example.com/');
				const res = await app.render(request);
				const html = await res.text();
				const $ = cheerioLoad(html);

				const themeAdded = $($('.themes-list .theme-added')[1]).text();
				expect(new Date(themeAdded).getTime()).to.not.be.NaN;
			});

			it('Allows expression defaults for text columns', async () => {
				const request = new Request('http://example.com/');
				const res = await app.render(request);
				const html = await res.text();
				const $ = cheerioLoad(html);

				const themeOwner = $($('.themes-list .theme-owner')[0]).text();
				expect(themeOwner).to.equal('');
			});

			it('Allows expression defaults for boolean columns', async () => {
				const request = new Request('http://example.com/');
				const res = await app.render(request);
				const html = await res.text();
				const $ = cheerioLoad(html);

				const themeDark = $($('.themes-list .theme-dark')[0]).text();
				expect(themeDark).to.equal('dark mode');
			});
		});
	});
});

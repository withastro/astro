import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { isWindows, loadFixture } from './test-utils.js';

describe('Aliases with tsconfig.json', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/alias-tsconfig/',
		});
	});

	if (isWindows) return;

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('can load client components', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);

			// Should render aliased element
			expect($('#client').text()).to.equal('test');

			const scripts = $('script').toArray();
			expect(scripts.length).to.be.greaterThan(0);
		});

		it('can load via baseUrl', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);

			expect($('#foo').text()).to.equal('foo');
			expect($('#constants-foo').text()).to.equal('foo');
		});

		it('can load namespace packages with @* paths', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);

			expect($('#namespace').text()).to.equal('namespace');
		});

		// TODO: fix this https://github.com/withastro/astro/issues/6551
		it.skip('works in css @import', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			console.log(html);
			// imported css should be bundled
			expect(html).to.include('#style-red');
			expect(html).to.include('#style-blue');
		});
	});
});

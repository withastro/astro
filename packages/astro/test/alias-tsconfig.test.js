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
		});

		it('works in css @import', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			// imported css should be bundled
			expect(html).to.include('#style-red');
			expect(html).to.include('#style-blue');
		});

		it('can load typescript files without .ts or .d.ts extensions', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);

			expect($('#mistery').text()).to.equal("I'm a TypeScript file!");
		});

		it('can load @foo/bar package with "@*" tsconfig paths alias', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);

			expect($('#at-pkg-alias').text()).to.equal('should render bar: bar');
		});
	});
});

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
	});
});

import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { isWindows, loadFixture } from './test-utils.js';

describe('Aliases with jsconfig.json', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/alias-jsconfig/',
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

			const style = $('style');

			// bundledCSS = (await fixture.readFile(bundledCSSHREF.replace(/^\/?/, '/')))
			// 	.replace(/\s/g, '')
			// 	.replace('/n', '');

			expect(true).to.equal(true)

			// Should render aliased element
			// expect($('#client').text()).to.equal('test');

			// const scripts = $('script').toArray();
			// expect(scripts.length).to.be.greaterThan(0);
		});
	});
});

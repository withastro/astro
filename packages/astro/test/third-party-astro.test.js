import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('third-party .astro component', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/third-party-astro/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('renders a page using a third-party .astro component', async () => {
			const html = await fixture.readFile('/astro-embed/index.html');
			const $ = cheerio.load(html);
			expect($('h1').text()).to.equal('Third-Party .astro test');
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('renders a page using a third-party .astro component', async () => {
			const html = await fixture.fetch('/astro-embed/').then((res) => res.text());
			const $ = cheerio.load(html);
			expect($('h1').text()).to.equal('Third-Party .astro test');
		});
	});
});

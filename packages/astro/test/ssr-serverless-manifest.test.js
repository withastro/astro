import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';
import * as cheerio from 'cheerio';

describe('astro:ssr-manifest', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-serverless-manifest/',
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('works', async () => {
		const pagePath = 'pages/index.astro';
		const app = await fixture.loadServerlessEntrypointApp(pagePath);
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();

		const $ = cheerio.load(html);
		expect($('#assets').text()).to.equal('["/_astro/index.a8a337e4.css"]');
	});
});

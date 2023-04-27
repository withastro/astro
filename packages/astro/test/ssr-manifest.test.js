import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from '../dist/testing/ssr-adapter.js';
import * as cheerio from 'cheerio';

describe('astro:ssr-manifest', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/ssr-manifest/', import.meta.url),
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('works', async () => {
		const { app } = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();

		const $ = cheerio.load(html);
		expect($('#assets').text()).to.equal('["/_astro/index.a8a337e4.css"]');
	});
});

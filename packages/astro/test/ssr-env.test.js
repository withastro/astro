import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('SSR Environment Variables', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-env/',
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('import.meta.env.SSR is true', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/ssr');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);
		expect($('#ssr').text()).to.equal('true');
	});
});

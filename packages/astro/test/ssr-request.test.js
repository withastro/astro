import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('Using Astro.request in SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-request/',
			adapter: testAdapter(),
			output: 'server',
		});
		await fixture.build();
	});

	it('Gets the request pased in', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/request');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerioLoad(html);
		expect($('#origin').text()).to.equal('http://example.com');
	});

	it('public file is copied over', async () => {
		const json = await fixture.readFile('/client/cars.json');
		expect(json).to.not.be.undefined;
	});
});

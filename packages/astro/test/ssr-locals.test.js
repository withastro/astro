import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('SSR Environment Variables', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-locals/',
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('Can access Astro.locals in page', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/foo');
		const route = match
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);
		expect($('#ssr').text()).to.equal('true');
	});

	it('Can access Astro.locals in API', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/api');
		const response = await app.render(request);
		expect(response.status).to.equal(200);
		expect(response.headers.get('Content-Type')).to.equal('application/json;charset=utf-8');
		expect(response.headers.get('Content-Length')).to.not.be.empty;
		const body = await response.json();

		expect(body.foo).to.equal('bar');
	});
});

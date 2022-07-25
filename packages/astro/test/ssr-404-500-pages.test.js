import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';
import * as cheerio from 'cheerio';

describe('404 and 500 pages', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-api-route-custom-404/',
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build({});
	});

	it('404 page returned when a route does not match', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/some/fake/route');
		const response = await app.render(request);
		expect(response.status).to.equal(404);
		const html = await response.text();
		const $ = cheerio.load(html);
		expect($('h1').text()).to.equal('Something went horribly wrong!');
	});

	it('500 page returned when there is an error', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/causes-error');
		const response = await app.render(request);
		expect(response.status).to.equal(500);
		const html = await response.text();
		const $ = cheerio.load(html);
		expect($('h1').text()).to.equal('This is an error page');
	});
});

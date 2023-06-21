import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('SSR Astro.locals from server', () => {
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
		const locals = { foo: 'bar' };
		const response = await app.render(request, undefined, locals);
		const html = await response.text();

		const $ = cheerio.load(html);
		expect($('#foo').text()).to.equal('bar');
	});

	it('Can access Astro.locals in api context', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/api');
		const locals = { foo: 'bar' };
		const response = await app.render(request, undefined, locals);
		expect(response.status).to.equal(200);
		const body = await response.json();

		expect(body.foo).to.equal('bar');
	});
});

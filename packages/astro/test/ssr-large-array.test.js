import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('SSR with Large Array and client rendering', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/large-array/',
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('Using response.arrayBuffer() gets the right HTML', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const data = await response.arrayBuffer();
		const html = new TextDecoder().decode(data);

		const $ = cheerio.load(html);
		expect($('head meta[name="viewport"]')).to.have.a.lengthOf(1);
		expect($('head link[rel="icon"]')).to.have.a.lengthOf(1);
		expect($('main')).to.have.a.lengthOf(1);
		expect($('astro-island')).to.have.a.lengthOf(1);
		expect($('h1').text()).to.equal('Hello, Solid!');
	});
});

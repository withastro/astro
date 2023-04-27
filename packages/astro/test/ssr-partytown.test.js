import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from '../dist/testing/ssr-adapter.js';

describe('Using the Partytown integration in SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/ssr-partytown/', import.meta.url),
			adapter: testAdapter(),
			output: 'server',
		});
		await fixture.build();
	});

	it('Has the scripts in the page', async () => {
		const { app } = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerioLoad(html);
		expect($('script')).to.have.a.lengthOf(1);
	});

	it('The partytown scripts are in the manifest', async () => {
		const { manifest } = await fixture.loadTestAdapterApp();
		expect(manifest.assets).to.contain('/~partytown/partytown-sw.js');
	});
});

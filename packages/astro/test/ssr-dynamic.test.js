import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

// Asset bundling
describe('Dynamic pages in SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/ssr-dynamic/',
			buildOptions: {
				experimentalSsr: true,
			},
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	async function fetchHTML(path) {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com' + path);
		const response = await app.render(request);
		const html = await response.text();
		return html;
	}

	it('Do not have to implement getStaticPaths', async () => {
		const html = await fetchHTML('/123');
		const $ = cheerioLoad(html);
		expect($('h1').text()).to.equal('Item 123');
	});

	it('Includes page styles', async () => {
		const html = await fetchHTML('/123');
		const $ = cheerioLoad(html);
		expect($('link').length).to.equal(1);
	});
});

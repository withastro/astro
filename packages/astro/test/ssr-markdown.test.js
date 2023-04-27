import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from '../dist/testing/ssr-adapter.js';

describe('Markdown pages in SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/ssr-markdown/', import.meta.url),
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	async function fetchHTML(path) {
		const { app } = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com' + path);
		const response = await app.render(request);
		const html = await response.text();
		return html;
	}

	it('Renders markdown pages correctly', async () => {
		const html = await fetchHTML('/post');
		const $ = cheerioLoad(html);
		expect($('#subheading').text()).to.equal('Subheading');
	});
});

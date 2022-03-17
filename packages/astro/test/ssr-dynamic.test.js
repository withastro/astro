import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';

// Asset bundling
describe('Dynamic pages in SSR', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/ssr-dynamic/',
			buildOptions: {
				experimentalSsr: true,
			}
		});
		await fixture.build();
	});

	it('Do not have to implement getStaticPaths', async () => {
		const app = await fixture.loadSSRApp();
		const request = new Request("http://example.com/123");
		const route = app.match(request);
		const response = await app.render(request, route);
		const html = await response.text();
		const $ = cheerioLoad(html);
		expect($('h1').text()).to.equal('Item 123');
	});
});

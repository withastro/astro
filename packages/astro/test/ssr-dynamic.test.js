import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';
import { App } from '../dist/core/app/index.js';

// Asset bundling
describe('Dynamic pages in SSR', () => {
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

	it('Do not have to implement getStaticPaths', async () => {
		const { createApp } = await import('./fixtures/ssr-dynamic/dist/server/entry.mjs');
		const app = createApp(new URL('./fixtures/ssr-dynamic/dist/server/', import.meta.url));
		const request = new Request('http://example.com/123');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerioLoad(html);
		expect($('h1').text()).to.equal('Item 123');
	});
});

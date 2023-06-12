import { loadFixture, readXML } from './test-utils.js';
import { expect } from 'chai';

describe('SSR support', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr/',
		});
		await fixture.build();
	});

	it('SSR pages require zero config', async () => {
		const data = await readXML(fixture.readFile('/client/sitemap-0.xml'));
		const urls = data.urlset.url;

		expect(urls[0].loc[0]).to.equal('http://example.com/one/');
		expect(urls[1].loc[0]).to.equal('http://example.com/two/');
	});
});

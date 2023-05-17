import { loadFixture, readXML } from './test-utils.js';
import { expect } from 'chai';

describe('getStaticPaths support', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static/',
		});
		await fixture.build();
	});

	it('getStaticPath pages require zero config', async () => {
		const data = await readXML(fixture.readFile('/sitemap-0.xml'));
		const urls = data.urlset.url;

		expect(urls[0].loc[0]).to.equal('http://example.com/one/');
		expect(urls[1].loc[0]).to.equal('http://example.com/two/');
	});
});

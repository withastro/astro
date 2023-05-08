import { loadFixture, readXML } from './test-utils.js';
import { expect } from 'chai';

describe('Content collections support', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/content/',
		});
		await fixture.build();
	});

	it('SSR pages require zero config', async () => {
		const data = await readXML(fixture.readFile('/sitemap-0.xml'));
		const urls = data.urlset.url;

		expect(urls[0].loc[0]).to.equal('https://example.com/');
		expect(urls[1].loc[0]).to.equal('https://example.com/blog/bar/');
		expect(urls[2].loc[0]).to.equal('https://example.com/blog/foo/');
	});
});

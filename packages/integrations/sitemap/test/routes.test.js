import { loadFixture, readXML } from './test-utils.js';
import { expect } from 'chai';

describe('routes', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
    /** @type {string[]} */
    let urls;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static/',
		});
		await fixture.build();
        const data = await readXML(fixture.readFile('/sitemap-0.xml'));
		urls = data.urlset.url.map(url => url.loc[0]);
	});

	it('does not include endpoints', async () => {
		expect(urls).to.not.include('http://example.com/endpoint.json');
	});

    it('does not include redirects', async () => {
		expect(urls).to.not.include('http://example.com/redirect');
	});
});

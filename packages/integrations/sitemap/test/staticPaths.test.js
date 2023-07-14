import { loadFixture, readXML } from './test-utils.js';
import { expect } from 'chai';

describe('getStaticPaths support', () => {
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
		urls = data.urlset.url.map((url) => url.loc[0]);
	});

	it('requires zero config for getStaticPaths', async () => {
		expect(urls).to.include('http://example.com/one/');
		expect(urls).to.include('http://example.com/two/');
	});

	it('does not include 404 pages', () => {
		expect(urls).to.not.include('http://example.com/404/');
	});

	it('includes numerical pages', () => {
		expect(urls).to.include('http://example.com/123/');
	});
});

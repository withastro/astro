import { loadFixture, readXML } from './test-utils.js';
import * as assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';

describe('getStaticPaths support', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	/** @type {string[]} */
	let urls;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static/',
			trailingSlash: 'always',
		});
		await fixture.build();

		const data = await readXML(fixture.readFile('/sitemap-0.xml'));
		urls = data.urlset.url.map((url) => url.loc[0]);
	});

	it('requires zero config for getStaticPaths', async () => {
		assert.strictEqual(urls.includes('http://example.com/one/'),true);
		assert.strictEqual(urls.includes('http://example.com/two/'),true)
	});

	it('does not include 404 pages', () => {
		assert.strictEqual(urls.includes('http://example.com/de/404/'),false);
	});

	it('does not include nested 404 pages', () => {
		assert.strictEqual(urls.includes('http://example.com/de/404/'),false);
	});

	it('includes numerical pages', () => {
		assert.strictEqual(urls.includes('http://example.com/123/'),true);
	});

	it('should render the endpoint', async () => {
		const page = await fixture.readFile('./it/manifest');
		assert.strictEqual(page.includes('I\'m a route in the "it" language.'),true);
	});
});

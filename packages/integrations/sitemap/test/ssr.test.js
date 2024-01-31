import { loadFixture, readXML } from './test-utils.js';
import * as assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';

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

		assert.equal(urls[0].loc[0],'http://example.com/one/')
		assert.equal(urls[1].loc[0],'http://example.com/two/')
	});
});

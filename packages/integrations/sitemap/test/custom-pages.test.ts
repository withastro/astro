import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { sitemap } from './fixtures/static/deps.mjs';
import { type Fixture, loadFixture, readXML } from './test-utils.ts';

describe('Sitemap with custom pages', () => {
	let fixture: Fixture;
	let urls: string[];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static/',
			integrations: [
				sitemap({
					customPages: ['http://example.com/custom-page'],
				}),
			],
		});
		await fixture.build();
		const data = await readXML(fixture.readFile('/sitemap-0.xml'));
		urls = data.urlset.url.map((url: { loc: string[] }) => url.loc[0]);
	});

	it('includes defined custom pages', async () => {
		assert.equal(urls.includes('http://example.com/custom-page'), true);
	});
});

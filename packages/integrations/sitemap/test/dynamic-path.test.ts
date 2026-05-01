import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture, readXML } from './test-utils.ts';

describe('Dynamic with rest parameter', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/dynamic',
		});
		await fixture.build();
	});

	it('Should generate correct urls', async () => {
		const data = await readXML(fixture.readFile('/sitemap-0.xml'));
		const urls = data.urlset.url.map((url: { loc: string[] }) => url.loc[0]);

		assert.ok(urls.includes('http://example.com/'));
		assert.ok(urls.includes('http://example.com/blog/'));
		assert.ok(urls.includes('http://example.com/test/'));
	});
});

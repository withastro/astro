import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture, readXML } from './test-utils.js';

describe('Custom sitemaps', () => {
  /** @type {import('./test-utils.js').Fixture} */
  let fixture;
  /** @type {string[]} */
  let urls;

  before(async () => {
    fixture = await loadFixture({
      root: './fixtures/static/',
    });
    await fixture.build();
    const data = await readXML(fixture.readFile('/sitemap-index.xml'));
    urls = data.sitemapindex.sitemap.map((sitemap) => sitemap.loc[0]);
  });

  it('includes defined custom sitemaps', async () => {
    assert.equal(urls.includes('http://example.com/custom-sitemap.xml'), true);
  });
});

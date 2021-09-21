/**
 * UNCOMMENT: add getStaticPaths() support

import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-rss/' });
  await fixture.build();
});

describe('Sitemap Generation', () => {
  test('Generates Sitemap correctly', async () => {
    let sitemap = await fixture.readFile('/sitemap.xml');
    expect(sitemap).toMatchSnapshot();
  });
});
*/

test.skip('is skipped', () => {});

/**
 * UNCOMMENT: add getStaticPaths()

import { loadFixture } from './test-utils';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({
    projectRoot: './fixtures/astro-get-static-paths/',
    buildOptions: {
      site: 'https://mysite.dev/blog/',
      sitemap: false,
    },
  });
  await fixture.build();
});

describe('getStaticPaths()', () => {
  test('is only called once during build', () => {
    // useless expect; if build() throws in setup then this test fails
    expect(true).toBe(true);
  });
});
*/

test.skip('is skipped', () => {});

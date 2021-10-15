/**
 * UNCOMMENT: fix "Error: can only be called once!"
import { expect } from 'chai';
import { loadFixture } from './test-utils';

let fixture;

before(async () => {
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
  it('is only called once during build', () => {
    // useless expect; if build() throws in setup then this test fails
    expect(true).to.equal(true);
  });
});
*/

it.skip('is skipped', () => {});

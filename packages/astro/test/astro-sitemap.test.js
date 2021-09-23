/**
 * UNCOMMENT: add getStaticPaths() support
import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

let fixture;

before(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/astro-rss/' });
  await fixture.build();
});

describe('Sitemap Generation', () => {
  it('Generates Sitemap correctly', async () => {
    let sitemap = await fixture.readFile('/sitemap.xml');
    expect(sitemap).to.be(''); // TODO: inline snapshot
  });
});
*/

it.skip('is skipped', () => {});

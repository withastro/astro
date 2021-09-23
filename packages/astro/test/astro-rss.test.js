/**
 * UNCOMMENT: add getStaticPaths() support
import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

let fixture;

before(async () => {
  fixture = await loadFixture({
    projectRoot: './fixtures/astro-rss/',
    buildOptions: {
      site: 'https://mysite.dev',
    },
  });
  await fixture.build();
});

describe.skip('RSS Generation', () => {
  it('generates RSS correctly', async () => {
    const rss = await fixture.readFile('/custom/feed.xml');
    expect(rss).to.be(''); // TODO: inline snapshot
  });
});
*/

it.skip('is skipped', () => {});

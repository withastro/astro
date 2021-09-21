/**
 * UNCOMMENT: add getStaticPaths() support

import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
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
    expect(rss).toMatchSnapshot();
  });
});
*/

test.skip('is skipped', () => {});

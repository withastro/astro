import { loadFixture } from './test-utils.js';

describe('Sitemap Generation', () => {
  let fixture;

  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/astro-rss/' });
    await fixture.build();
  });

  test('Generates Sitemap correctly', async () => {
    let sitemap = await fixture.readFile('/sitemap.xml');
    expect(sitemap).toMatchSnapshot();
  });
});

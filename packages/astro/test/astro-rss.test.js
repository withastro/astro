import { loadFixture } from './test-utils.js';

describe('RSS Generation', () => {
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

  it('generates RSS correctly', async () => {
    const rss = await fixture.readFile('/custom/feed.xml');
    expect(rss).toMatchSnapshot();
  });
});

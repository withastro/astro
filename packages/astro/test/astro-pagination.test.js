import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Pagination', () => {
  let fixture;
  let devServer;

  beforeAll(async () => {
    fixture = await loadFixture({
      projectRoot: './fixtures/astro-pagination/',
      buildOptions: {
        site: 'https://mysite.dev/blog/',
        sitemap: false,
      },
    });
    devServer = await fixture.dev();
  });

  test('optional root page', async () => {
    const results = await Promise.all([fixture.fetch('/posts/optional-root-page/'), fixture.fetch('/posts/optional-root-page/2'), fixture.fetch('/posts/optional-root-page/3')]);
    for (const result of results) {
      expect(result.statusCode).toBe(200);
    }
  });

  test('named root page', async () => {
    const results = await Promise.all([fixture.fetch('/posts/named-root-page/1'), fixture.fetch('/posts/named-root-page/2'), fixture.fetch('/posts/named-root-page/3')]);
    for (const result of results) {
      expect(result.statusCode).toBe(200);
    }
  });

  test('multiple params', async () => {
    const params = [
      { color: 'red', p: '1' },
      { color: 'blue', p: '1' },
      { color: 'blue', p: '2' },
    ];
    await Promise.all(
      params.map(({ color, p }) => {
        const html = await fixture.fetch(`/posts/${color}/${p}`).then((res) => res.text());
        const $ = cheerio.load(html);
        expect($('#page-a').text()).toBe(p);
        expect($('#page-b').text()).toBe(p);
        expect($('#filter').text()).toBe(color);
      })
    );
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.stop();
  });
});

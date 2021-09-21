/**
 * UNCOMMENT: add Astro.fetchContent()

import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({
    projectRoot: './fixtures/astro-pagination/',
    buildOptions: {
      site: 'https://mysite.dev/blog/',
      sitemap: false,
    },
  });
  await fixture.build();
});

describe('Pagination', () => {
  test('optional root page', async () => {
    for (const file of ['/posts/optional-root-page/index.html', '/posts/optional-root-page/2/index.html', '/posts/optional-root-page/3/index.html']) {
      expect(await fixture.readFile(file)).toBeTruthy();
    }
  });

  test('named root page', async () => {
    for (const file of ['/posts/named-root-page/index.html', '/posts/named-root-page/2/index.html', '/posts/named-root-page/3/index.html']) {
      expect(await fixture.readFile(file)).toBeTruthy();
    }
  });

  test('multiple params', async () => {
    const params = [
      { color: 'red', p: '1' },
      { color: 'blue', p: '1' },
      { color: 'blue', p: '2' },
    ];
    await Promise.all(
      params.map(async ({ color, p }) => {
        const html = await fixture.readFile(`/posts/${color}/${p}/index.html`);
        const $ = cheerio.load(html);
        expect($('#page-a').text()).toBe(p);
        expect($('#page-b').text()).toBe(p);
        expect($('#filter').text()).toBe(color);
      })
    );
  });
});
*/

test.skip('is skipped', () => {});

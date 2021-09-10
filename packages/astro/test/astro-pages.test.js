import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Pages', () => {
  let fixture;

  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/astro-pages/' });
  });

  describe('dev', () => {
    let devServer;

    beforeAll(async () => {
      devServer = await fixture.dev();
    });

    test('Can find page with "index" at the end file name', async () => {
      const html = await fixture.fetch('/posts/name-with-index').then((res) => res.text());
      const $ = cheerio.load(html);

      expect($('h1').text()).toBe('Name with index');
    });

    // important: close dev server (free up port and connection)
    afterAll(async () => {
      await devServer.stop();
    });
  });

  describe('build', () => {
    beforeAll(async () => {
      await fixture.build();
    });

    test('Can find page with "index" at the end file name', async () => {
      const html = await fixture.readFile('/posts/name-with-index/index.html');
      const $ = cheerio.load(html);

      expect($('h1').text()).toBe('Name with index');
    });
  });
});

import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro.*', () => {
  let fixture;

  beforeAll(async () => {
    fixture = await loadFixture({
      projectRoot: './fixtures/astro-global/',
      buildOptions: {
        site: 'https://mysite.dev/blog/',
        sitemap: false,
      },
    });
  });

  describe('dev', () => {
    let devServer;

    beforeAll(async () => {
      devServer = await fixture.dev();
    });

    test('Astro.request.url', async () => {
      const html = await fixture.fetch('/').then((res) => res.text());
      const $ = cheerio.load(html);

      expect($('#pathname').text()).toBe('/');
      expect($('#child-pathname').text()).toBe('/');
      expect($('#nested-child-pathname').text()).toBe('/');
    });

    test('Astro.request.canonicalURL', async () => {
      // given a URL, expect the following canonical URL
      const canonicalURLs = {
        '/': 'https://mysite.dev/blog/',
        '/post/post': 'https://mysite.dev/blog/post/post/',
        '/posts/1': 'https://mysite.dev/blog/posts/',
        '/posts/2': 'https://mysite.dev/blog/posts/2/',
      };

      for (const [url, canonicalURL] of Object.entries(canonicalURLs)) {
        const result = await fixture.fetch(url).then((res) => res.text());
        const $ = cheerio.load(result.contents);
        expect($('link[rel="canonical"]').attr('href')).toBe(canonicalURL);
      }
    });

    test('Astro.site', async () => {
      const html = await fixture.fetch('/').then((res) => res.text());
      const $ = cheerio.load(html);
      expect($('#site').attr('href')).toBe('https://mysite.dev/blog/');
    });

    test('Astro.resolve in development', async () => {
      const html = await fixture.fetch('/resolve').then((res) => res.text());
      const $ = cheerio.load(html);
      expect($('img').attr('src')).toBe('/_astro/src/images/penguin.png');
      expect($('#inner-child img').attr('src')).toBe('/_astro/src/components/nested/images/penguin.png');
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

    test('Astro.resolve in the build', async () => {
      const html = await fixture.readFile('/resolve/index.html');
      const $ = cheerio.load(html);
      expect($('img').attr('src')).toBe('/blog/_astro/src/images/penguin.png');
    });
  });
});

import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Plain Markdown tests', () => {
  let fixture;

  beforeAll(async () => {
    fixture = await loadFixture({
      projectRoot: './fixtures/markdown-plain/',
      buildOptions: {
        sitemap: false,
      },
      renderers: ['@astrojs/renderer-preact'],
    });
  });

  describe('dev', () => {
    let devServer;

    beforeAll(async () => {
      devServer = await fixture.dev();
    });

    test('Can load a simple markdown page with Astro', async () => {
      const html = await fixture.fetch('/post').then((res) => res.text());
      const $ = cheerio.load(html);

      expect($('p').first().text()).toBe('Hello world!');
      expect($('#first').text()).toBe('Some content');
      expect($('#interesting-topic').text()).toBe('Interesting Topic');
    });

    test('Can load a realworld markdown page with Astro', async () => {
      const html = await fixture.fetch('/realworld').then((res) => res.text());
      const $ = cheerio.load(html);

      expect($('pre')).toHaveLength(7);
    });

    // important: close dev server (free up port and connection)
    afterAll(async () => {
      await devServer.stop();
    });
  });

  describe('build', () => {
    test('Builds markdown pages for prod', () => {
      expect(() => fixture.build()).not.toThrow();
    });
  });
});

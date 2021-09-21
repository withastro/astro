/**
 * UNCOMMENT: add Astro.* global


import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({
    projectRoot: './fixtures/astro-global/',
    buildOptions: {
      site: 'https://mysite.dev/blog/',
      sitemap: false,
    },
  });
  await fixture.build();
});


describe('Astro.*', () => {
  test('Astro.request.url', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    expect($('#pathname').text()).toBe('/');
    expect($('#child-pathname').text()).toBe('/');
    expect($('#nested-child-pathname').text()).toBe('/');
  });

  test('Astro.request.canonicalURL', async () => {
    // given a URL, expect the following canonical URL
    const canonicalURLs = {
      '/': 'https://mysite.dev/blog/index.html',
      '/post/post': 'https://mysite.dev/blog/post/post/index.html',
      '/posts/1': 'https://mysite.dev/blog/posts/index.html',
      '/posts/2': 'https://mysite.dev/blog/posts/2/index.html',
    };

    for (const [url, canonicalURL] of Object.entries(canonicalURLs)) {
      const result = await fixture.readFile(url);
      const $ = cheerio.load(result.contents);
      expect($('link[rel="canonical"]').attr('href')).toBe(canonicalURL);
    }
  });

  test('Astro.site', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);
    expect($('#site').attr('href')).toBe('https://mysite.dev/blog/');
  });

  test('Astro.resolve in development', async () => {
    const html = await fixture.readFile('/resolve/index.html');
    const $ = cheerio.load(html);
    expect($('img').attr('src')).toBe('/_astro/src/images/penguin.png');
    expect($('#inner-child img').attr('src')).toBe('/_astro/src/components/nested/images/penguin.png');
  });

  test('Astro.resolve in the build', async () => {
    const html = await fixture.readFile('/resolve/index.html');
    const $ = cheerio.load(html);
    expect($('img').attr('src')).toBe('/blog/_astro/src/images/penguin.png');
  });
});
*/

test.skip('is skipped', () => {});

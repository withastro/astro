/**
 * UNCOMMENT: add markdown support

import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({
    projectRoot: './fixtures/markdown/',
    buildOptions: {
      sitemap: false,
    },
    renderers: ['@astrojs/renderer-preact'],
  });
  await fixture.build();
});

describe('Markdown tests', () => {
  test('Can load a simple markdown page with Astro', async () => {
    const html = await fixture.readFile('/post/index.html');
    const $ = cheerio.load(html);

    expect($('p').first().text()).toBe('Hello world!');
    expect($('#first').text()).toBe('Some content');
    expect($('#interesting-topic').text()).toBe('Interesting Topic');
  });

  test('Can load a realworld markdown page with Astro', async () => {
    const html = await fixture.fetch('/realworld/index.html');
    const $ = cheerio.load(html);

    expect($('pre')).toHaveLength(7);
  });
});
*/

test.skip('is skipped', () => {});

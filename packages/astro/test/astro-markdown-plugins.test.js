/**
 * UNCOMMENT: add markdown plugin support

import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({
    projectRoot: './fixtures/astro-markdown-plugins/',
    renderers: ['@astrojs/renderer-preact'],
    markdownOptions: {
      remarkPlugins: ['remark-code-titles', 'remark-slug', ['rehype-autolink-headings', { behavior: 'prepend' }]],
      rehypePlugins: [
        ['rehype-toc', { headings: ['h2', 'h3'] }],
        ['rehype-add-classes', { 'h1,h2,h3': 'title' }],
      ],
    },
    buildOptions: {
      sitemap: false,
    },
  });
  await fixture.build();
});


describe('Astro Markdown plugins', () => {
  test('Can render markdown with plugins', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    // test 1: Added a TOC
    expect($('.toc')).toHaveLength(1);

    // teste 2: Added .title to h1
    expect($('#hello-world').hasClass('title')).toBeTrue();
  });

  test('Can render Astro <Markdown> with plugins', async () => {
    const html = await fixture.readFile('/astro/index.html');
    const $ = cheerio.load(html);

    // test 1: Added a TOC
    expect($('.toc')).toHaveLength(1);

    // teste 2: Added .title to h1
    expect($('#hello-world').hasClass('title')).toBeTrue();
  });
});
*/

test.skip('is skipped', () => {});

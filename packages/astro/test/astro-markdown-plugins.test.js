import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro Markdown plugins', () => {
  let fixture;
  let devServer;

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
    devServer = await fixture.dev();
  });

  test('Can render markdown with plugins', async () => {
    const html = await fixture.fetch('/').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: Added a TOC
    expect($('.toc')).toHaveLength(1);

    // teste 2: Added .title to h1
    expect($('#hello-world').hasClass('title')).toBeTrue();
  });

  test('Can render Astro <Markdown> with plugins', async () => {
    const html = await fixture.fetch('/astro').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: Added a TOC
    expect($('.toc')).toHaveLength(1);

    // teste 2: Added .title to h1
    expect($('#hello-world').hasClass('title')).toBeTrue();
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.stop();
  });
});

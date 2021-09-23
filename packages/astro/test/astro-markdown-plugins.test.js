/**
 * UNCOMMENT: add markdown plugin support
import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

before(async () => {
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
  it('Can render markdown with plugins', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    // test 1: Added a TOC
    expect($('.toc')).to.have.lengthOf(1);

    // teste 2: Added .title to h1
    expect($('#hello-world').hasClass('title')).toBeTrue();
  });

  it('Can render Astro <Markdown> with plugins', async () => {
    const html = await fixture.readFile('/astro/index.html');
    const $ = cheerio.load(html);

    // test 1: Added a TOC
    expect($('.toc')).to.have.lengthOf(1);

    // teste 2: Added .title to h1
    expect($('#hello-world').hasClass('title')).toBeTrue();
  });
});
*/

it.skip('is skipped', () => {});

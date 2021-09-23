/**
 * UNCOMMENT: add Astro.* global

import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

before(async () => {
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
  it('Astro.request.url', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    expect($('#pathname').text()).to.equal('/');
    expect($('#child-pathname').text()).to.equal('/');
    expect($('#nested-child-pathname').text()).to.equal('/');
  });

  it('Astro.request.canonicalURL', async () => {
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
      expect($('link[rel="canonical"]').attr('href')).to.equal(canonicalURL);
    }
  });

  it('Astro.site', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);
    expect($('#site').attr('href')).to.equal('https://mysite.dev/blog/');
  });

  it('Astro.resolve in development', async () => {
    const html = await fixture.readFile('/resolve/index.html');
    const $ = cheerio.load(html);
    expect($('img').attr('src')).to.equal('/_astro/src/images/penguin.png');
    expect($('#inner-child img').attr('src')).to.equal('/_astro/src/components/nested/images/penguin.png');
  });

  it('Astro.resolve in the build', async () => {
    const html = await fixture.readFile('/resolve/index.html');
    const $ = cheerio.load(html);
    expect($('img').attr('src')).to.equal('/blog/_astro/src/images/penguin.png');
  });
});
*/

it.skip('is skipped', () => {});

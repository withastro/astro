import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Astro.*', () => {
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
      '/index.html': 'https://mysite.dev/blog/',
      '/post/post/index.html': 'https://mysite.dev/blog/post/post/',
      '/posts/1/index.html': 'https://mysite.dev/blog/posts/',
      '/posts/2/index.html': 'https://mysite.dev/blog/posts/2/',
    };

    for (const [url, canonicalURL] of Object.entries(canonicalURLs)) {
      const html = await fixture.readFile(url);

      const $ = cheerio.load(html);
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
    expect($('img').attr('src')).to.include('/src/images/penguin.png');
    expect($('#inner-child img').attr('src')).to.include('/src/components/nested/images/penguin.png');
  });
});

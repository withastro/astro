import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('CSS Bundling (ESM import)', () => {
  let fixture;

  before(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/astro-css-bundling-import/' });
    await fixture.build();
  });

  it('CSS output in import order', async () => {
    // note: this test is a little confusing, but the main idea is that
    // page-2.astro contains all of page-1.astro, plus some unique styles.
    // we only test page-2 to ensure the proper order is observed.
    const html = await fixture.readFile('/page-2/index.html');
    const $ = cheerio.load(html);

    let css = '';

    for (const style of $('link[rel=stylesheet]')) {
      const href = style.attribs.href.replace(/^\.\./, '');
      if (!href) continue;
      css += await fixture.readFile(href);
    }

    // test 1: insure green comes after red (site.css)
    expect(css.indexOf('p{color:green}')).to.be.greaterThan(css.indexOf('p{color:red}'));

    // test 2: insure green comes after blue (page-1.css)
    expect(css.indexOf('p{color:green}')).to.be.greaterThan(css.indexOf('p{color:red}'));
  });

  // TODO: need more investigation to fix this
  it.skip('no empty CSS files', async () => {
    for (const page of ['/page-1/index.html', '/page-2/index.html']) {
      const html = await fixture.readFile(page);
      const $ = cheerio.load(html);

      for (const style of $('link[rel=stylesheet]')) {
        const href = style.attribs.href.replace(/^\.\./, '');
        if (!href) continue;
        const css = await fixture.readFile(href);

        expect(css).to.be.ok;
      }
    }
  });
});

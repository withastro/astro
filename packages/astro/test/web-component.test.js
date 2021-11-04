import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Web component', () => {
  let fixture;

  before(async () => {
    fixture = await loadFixture({
      projectRoot: './fixtures/web-component/',
      renderers: ['@astrojs/renderer-wc'],
    });
    await fixture.build();
  });

  it('Can load a component', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    // test 1: get automatically named custom element
    expect($('html-blue')).to.have.lengthOf(1);
  });

  it('Can load a named component', async () => {
    const html = await fixture.readFile('/registered/index.html');
    const $ = cheerio.load(html);

    // test 1: get name-registered custom element
    expect($('custom-blue')).to.have.lengthOf(1);
  });

  it('Can load a hydratable component', async () => {
    const html = await fixture.readFile('/hydrated/index.html');
    const $ = cheerio.load(html);

    // test 1: get custom element
    expect($('html-blue')).to.have.lengthOf(1);

    // test 2: get custom element hydrating script
    expect($('script[type="module"]')).to.have.lengthOf(1);
  });

  it('Can assign attributes and slots to a component', async () => {
    const html = await fixture.readFile('/props/index.html');
    const $ = cheerio.load(html);

    // test 1: get custom element
    expect($('html-color')).to.have.lengthOf(1);

    // test 1: get observed attribute
    expect($('html-color[color]')).to.have.lengthOf(1);

    // test 1: ignore non-observed attribute
    expect($('html-color[more]')).to.have.lengthOf(0);

    // test 1: get slotted data
    expect($('html-color > data[slot="more"]')).to.have.lengthOf(1);
  });
});

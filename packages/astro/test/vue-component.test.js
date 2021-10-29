import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Vue component', () => {
  let fixture;

  before(async () => {
    fixture = await loadFixture({
      projectRoot: './fixtures/vue-component/',
      renderers: ['@astrojs/renderer-vue'],
    });
    await fixture.build();
  });

  it('Can load Vue', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    const allPreValues = $('pre')
      .toArray()
      .map((el) => $(el).text());

    // test 1: renders all components correctly
    expect(allPreValues).to.deep.equal(['0', '1', '10', '100', '1000']);

    // test 2: renders 3 <astro-root>s
    expect($('astro-root')).to.have.lengthOf(4);

    // test 3: all <astro-root>s have uid attributes
    expect($('astro-root[uid]')).to.have.lengthOf(4);

    // test 5: all <astro-root>s have unique uid attributes
    const uniqueRootUIDs = $('astro-root').map((i, el) => $(el).attr('uid'));
    expect(new Set(uniqueRootUIDs).size).to.equal(4);
  });
});

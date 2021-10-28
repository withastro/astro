import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

before(async () => {
  fixture = await loadFixture({
    projectRoot: './fixtures/solid-component/',
    renderers: ['@astrojs/renderer-solid'],
  });
  await fixture.build();
});

describe('Solid component', () => {
  it('Can load a component', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    // test 1: Works
    expect($('.hello')).to.have.lengthOf(1);
  });
});

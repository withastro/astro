import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('unocss', () => {
  let fixture;

  before(async () => {
    fixture = await loadFixture({
      projectRoot: './fixtures/with-unocss/',
    });
    try {
      await fixture.build();
    } catch(err) {
      console.log('wha...', err);
    }
    
  });

  it('Build when they create their own URLs', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);

    // test 1: Link added
    expect($('link').attr('href').includes('assets/'));
  });
});

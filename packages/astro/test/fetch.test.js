/**
 * UNCOMMENT: add fetch() in component support
import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

before(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/fetch/' });
  await fixture.build();
});


describe('Global Fetch', () => {
  it('Is available in non-Astro components.', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);
    expect($('#jsx').text()).to.equal('function');
  });
});
*/

it.skip('is skipped', () => {});

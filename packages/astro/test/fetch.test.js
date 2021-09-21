/**
 * UNCOMMENT: add fetch() in component support

import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({ projectRoot: './fixtures/fetch/' });
  await fixture.build();
});


describe('Global Fetch', () => {
  test('Is available in non-Astro components.', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);
    expect($('#jsx').text()).toBe('function');
  });
});
*/

test.skip('is skipped', () => {});

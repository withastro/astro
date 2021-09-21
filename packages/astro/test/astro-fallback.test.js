import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

let fixture;

beforeAll(async () => {
  fixture = await loadFixture({
    projectRoot: './fixtures/astro-fallback',
    renderers: ['@astrojs/renderer-preact'],
  });
  await fixture.build();
});

describe('Dynamic component fallback', () => {
  test('Shows static content', async () => {
    const html = await fixture.readFile('/index.html');
    const $ = cheerio.load(html);
    expect($('#fallback').text()).toBe('static');
  });
});

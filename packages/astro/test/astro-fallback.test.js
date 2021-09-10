import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Dynamic component fallback', () => {
  let fixture;
  let devServer;

  beforeAll(async () => {
    fixture = await loadFixture({
      projectRoot: './fixtures/astro-fallback',
      renderers: ['@astrojs/renderer-preact'],
    });
    devServer = await fixture.dev();
  });

  test('Shows static content', async () => {
    const html = await fixture.fetch('/').then((res) => res.text());
    const $ = cheerio.load(html);
    expect($('#fallback').text()).toBe('static');
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.close();
  });
});

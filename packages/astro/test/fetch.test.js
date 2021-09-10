import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Global Fetch', () => {
  let fixture;
  let devServer;

  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/fetch/' });
    devServer = await fixture.dev();
  });

  test('Is available in non-Astro components.', async () => {
    const html = await fixture.fetch('/').then((res) => res.text());
    const $ = cheerio.load(html);
    expect($('#jsx').text()).toBe('function');
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.stop();
  });
});

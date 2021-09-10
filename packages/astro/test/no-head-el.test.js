import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Documents without a head', () => {
  let fixture;
  let devServer;

  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/no-head-el/' });
    devServer = await fixture.dev();
  });

  test('Places style and scripts before the first non-head element', async () => {
    const html = await fixture.fetch('/').then((res) => res.text());
    const $ = cheerio.load(html);

    // test 1: Link to css placed after <title>
    expect($('title').next().is('link')).toBe(true);

    // test 2: Link for a child component
    expect($('title').next().next().is('link')).toBe(true);

    // test 3: <astro-root> style placed after <link>
    expect($('title').next().next().next().is('style')).toBe(true);

    // note(drew): commented-out with Vite now handling HMR
    // assert.equal($('title').next().next().next().next().is('script'), true, 'HMR script after the style');
    // assert.equal($('script[src="/_snowpack/hmr-client.js"]').length, 1, 'Only the hmr client for the page');
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.stop();
  });
});

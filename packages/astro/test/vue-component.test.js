import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Vue component', () => {
  let fixture;
  let devServer;

  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/vue-component/' });
    devServer = await fixture.dev();
  });

  test('Can load Vue', async () => {
    const html = await fixture.fetch('/').then((res) => res.text());
    const $ = cheerio.load(html);

    const allPreValues = $('pre')
      .toArray()
      .map((el) => $(el).text());

    // test 1: renders all components correctly
    expect(allPreValues).toEqual(['0', '1', '10', '100', '1000']);

    // test 2: renders 3 <astro-root>s
    expect($('astro-root')).toHaveLength(4);

    // test 3: all <astro-root>s have uid attributes
    expect($('astro-root[uid]')).toHaveLength(4);

    // test 5: all <astro-root>s have unique uid attributes
    const uniqueRootUIDs = $('astro-root').map((i, el) => $(el).attr('uid'));
    expect(new Set(uniqueRootUIDs).size).toBe(4);
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.stop();
  });
});

import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Client only components', () => {
  let fixture;
  let devServer;

  beforeAll(async () => {
    fixture = await loadFixture({ projectRoot: './fixtures/astro-client-only/' });
    devServer = await fixture.dev();
  });

  test('Loads pages using client:only hydrator', async () => {
    const html = await fixture.fetch('/').then((res) => res.html());
    const $ = cheerio.load(html);

    // test 1: <astro-root> is empty
    expect($('astro-root').html()).toBe('');

    // test 2: svelte renderer is on the page
    const exp = /import\("(.+?)"\)/g;
    let match, svelteRenderer;
    while ((match = exp.exec(result.contents))) {
      if (match[1].includes('renderers/renderer-svelte/client.js')) {
        svelteRenderer = match[1];
      }
    }
    expect(svelteRenderer).toBeTruthy();

    // test 3: can load svelte renderer
    result = await fixture.fetch(svelteRenderer);
    expect(result.statusCode).toBe(200);
  });

  test('Can build a project with svelte dynamic components', async () => {
    expect(() => fixture.build()).not.toThrow();
  });

  // important: close dev server (free up port and connection)
  afterAll(async () => {
    await devServer.close();
  });
});
